# CampConnect — System Architecture Diagrams

This document contains the complete architectural, sequence, state, and entity-relationship (ER) diagrams for **CampConnect**.

---

## 1. High-Level System Architecture Diagram

```mermaid
flowchart TB
    subgraph Users["User Roles (Actors)"]
        SW["Social Worker"]
        OA["Organization Admin (NGO / Hospital)"]
        CSR["CSR Admin (Corporate Sponsor)"]
        COORD["Coordinator (Verifier)"]
    end

    subgraph Frontend["Frontend Client (React 18 + Vite + Tailwind CSS)"]
        Router["React Router v6 & ProtectedRoute"]
        AuthCtx["AuthContext (JWT Session State)"]
        Dashboards["Role-Specific Dashboards & Forms"]
        Leaflet["React-Leaflet (Interactive GPS Map & Pincode Lookup)"]
        Axios["Axios API Service (services/api.js)"]
    end

    subgraph Backend["Backend API Server (Node.js + Express.js)"]
        subgraph Middleware["Express Middleware Layer"]
            CORS["CORS & JSON Body Parser"]
            JWTAuth["authenticateToken (JWT Verification)"]
            RBAC["authorizeRoles (Role-Based Access Control)"]
            Multer["uploadMiddleware (Multer Multipart File Handler)"]
        end

        subgraph Controllers["Controllers & Business Logic"]
            AuthCtrl["authController (/api/auth)"]
            OrgCtrl["organizationController (/api/organizations)"]
            CompCtrl["companyController (/api/companies)"]
            TicketCtrl["ticketController (/api/tickets)"]
            NotifCtrl["notificationController & ticketAcceptanceController (/api/notifications)"]
            CampCtrl["campController (/api/camps)"]
            FundCtrl["fundingController (/api/funding)"]
            ReportCtrl["reportController (/api/reports)"]
        end

        subgraph Services["Domain Services"]
            SpatialSvc["ticketMatchingService (50km ST_Distance_Sphere Matcher)"]
        end
    end

    subgraph Storage["Storage & Database Layer"]
        Uploads["Static File Storage / Cloudinary (/uploads/*)"]
        subgraph MySQL["MySQL 8.0+ (InnoDB Engine)"]
            SpatialIdx["Spatial Engine (POINT SRID 4326 + SPATIAL INDEX)"]
            ACID["ACID Transactions (Row-Level Locking via SELECT ... FOR UPDATE)"]
            Tables["9 Relational Tables (users, organizations, pincode_lookup, tickets, ticket_notifications, camps, companies, camp_funding, camp_reports)"]
        end
    end

    SW & OA & CSR & COORD --> Router
    Router --> AuthCtx
    Router --> Dashboards
    Dashboards --> Leaflet
    Dashboards --> Axios

    Axios ==>|"REST API (/api/*) + Bearer JWT"| CORS
    CORS --> JWTAuth --> RBAC
    RBAC --> AuthCtrl & OrgCtrl & CompCtrl & TicketCtrl & NotifCtrl & CampCtrl & FundCtrl
    RBAC --> Multer --> ReportCtrl

    TicketCtrl -->|"Triggers on Ticket Creation"| SpatialSvc
    ReportCtrl -->|"Saves Proof Photo"| Uploads

    AuthCtrl & OrgCtrl & CompCtrl & TicketCtrl & NotifCtrl & CampCtrl & FundCtrl & ReportCtrl & SpatialSvc ==>|"mysql2/promise Connection Pool"| MySQL
    MySQL --- SpatialIdx
    MySQL --- ACID
    MySQL --- Tables
```

---

## 2. End-to-End Workflow & Transaction Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor SW as Social Worker
    participant API as Express Backend API
    participant DB as MySQL 8.0 (InnoDB)
    actor OA as Org Admin (Hospital/NGO)
    actor CSR as CSR Admin (Company)
    actor COORD as Coordinator

    Note over SW,DB: Stage 1: Geospatial Ticket Creation & Matching
    SW->>API: POST /api/tickets (GPS lat/lon, focus area, patient count)
    API->>DB: INSERT INTO tickets (ST_SRID(POINT(lon, lat), 4326))
    API->>DB: BEGIN TRANSACTION (ticketMatchingService)
    API->>DB: SELECT orgs WHERE ST_Distance_Sphere(org.location, ticket.gps_location) <= 50km
    API->>DB: INSERT INTO ticket_notifications (status = 'notified')
    API->>DB: UPDATE tickets SET status = 'matched'
    API->>DB: COMMIT
    API-->>SW: 201 Created (Matched Organizations List)

    Note over OA,DB: Stage 2: Pessimistic-Locked Ticket Acceptance
    OA->>API: GET /api/notifications/mine
    API-->>OA: List of nearby 'notified' tickets
    OA->>API: POST /api/notifications/:id/accept
    API->>DB: BEGIN TRANSACTION
    API->>DB: SELECT notification & ticket FOR UPDATE (Locks rows)
    API->>DB: UPDATE ticket_notifications SET status = 'accepted' (winner)
    API->>DB: UPDATE ticket_notifications SET status = 'expired' (other orgs)
    API->>DB: UPDATE tickets SET status = 'accepted'
    API->>DB: INSERT INTO camps (status = 'planned')
    API->>DB: COMMIT
    API-->>OA: 201 Created (Camp Planned)

    Note over CSR,DB: Stage 3: Budget-Checked CSR Funding Transaction
    CSR->>API: GET /api/camps/fundable
    API-->>CSR: List of 'planned' unfunded camps
    CSR->>API: POST /api/funding (company_id, camp_id, amount)
    API->>DB: BEGIN TRANSACTION
    API->>DB: SELECT company FOR UPDATE & SELECT camp FOR UPDATE
    API->>DB: Verify csr_budget_committed + amount <= csr_budget_total
    API->>DB: INSERT INTO camp_funding (status = 'committed')
    API->>DB: UPDATE companies SET csr_budget_committed = csr_budget_committed + amount
    API->>DB: UPDATE tickets SET status = 'funded'
    API->>DB: COMMIT
    API-->>CSR: 201 Created (Funding Committed)

    Note over OA,DB: Stage 4: Camp Execution & Proof Report Upload
    OA->>API: POST /api/reports (Multipart: camp_id, patients_served, proof_photo)
    API->>DB: INSERT INTO camp_reports (verified = FALSE, proof_document_url)
    API-->>OA: 201 Created (Report Pending Verification)

    Note over COORD,DB: Stage 5: Atomic Multi-Table Report Verification
    COORD->>API: GET /api/reports/pending
    API-->>COORD: Unverified reports + proof URLs
    COORD->>API: POST /api/reports/:id/verify
    API->>DB: BEGIN TRANSACTION
    API->>DB: SELECT report, camp, camp_funding FOR UPDATE
    API->>DB: UPDATE camp_reports SET verified = TRUE, verified_by = coord_id
    API->>DB: UPDATE camp_funding SET status = 'utilized', utilized_at = NOW()
    API->>DB: UPDATE camps SET status = 'completed'
    API->>DB: UPDATE tickets SET status = 'completed'
    API->>DB: COMMIT
    API-->>COORD: 200 OK (Workflow Completed)
```

---

## 3. Database Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    USERS {
        int user_id PK
        varchar name
        varchar phone UK
        varchar email UK
        varchar password_hash
        enum role "social_worker | org_admin | csr_admin | coordinator"
        timestamp created_at
    }

    ORGANIZATIONS {
        int org_id PK
        int org_admin_id FK
        varchar name
        enum type "NGO | Hospital"
        point location "SRID 4326 (SPATIAL INDEX)"
        varchar pincode
        varchar specialization
        int capacity
    }

    PINCODE_LOOKUP {
        varchar pincode PK
        decimal latitude
        decimal longitude
        varchar district
        varchar state
    }

    TICKETS {
        int ticket_id PK
        int social_worker_id FK
        point gps_location "SRID 4326 (SPATIAL INDEX)"
        varchar pincode
        int expected_patient_count
        varchar health_focus_area
        date preferred_date_from
        date preferred_date_to
        enum urgency "low | medium | high"
        enum status "open | matched | accepted | funded | completed | rejected_all"
    }

    TICKET_NOTIFICATIONS {
        int notif_id PK
        int ticket_id FK
        int org_id FK
        decimal distance_km
        enum status "notified | accepted | rejected | expired"
        timestamp notified_at
        timestamp responded_at
    }

    CAMPS {
        int camp_id PK
        int ticket_id FK "UNIQUE"
        int org_id FK
        date start_date
        date end_date
        enum status "planned | ongoing | completed | cancelled"
    }

    COMPANIES {
        int company_id PK
        int csr_admin_id FK
        varchar name
        varchar industry
        decimal csr_budget_total
        decimal csr_budget_committed "CHECK <= csr_budget_total"
    }

    CAMP_FUNDING {
        int funding_id PK
        int company_id FK
        int camp_id FK
        decimal amount_committed
        enum status "committed | utilized | cancelled"
        timestamp committed_at
        timestamp utilized_at
    }

    CAMP_REPORTS {
        int report_id PK
        int camp_id FK "UNIQUE"
        int submitted_by FK
        int patients_served_count
        text summary_notes
        varchar proof_document_url
        boolean verified
        int verified_by FK
        timestamp verified_at
    }

    USERS ||--o{ ORGANIZATIONS : "manages (org_admin)"
    USERS ||--o{ COMPANIES : "manages (csr_admin)"
    USERS ||--o{ TICKETS : "creates (social_worker)"
    USERS ||--o{ CAMP_REPORTS : "submits (org_admin)"
    USERS ||--o{ CAMP_REPORTS : "verifies (coordinator)"
    TICKETS ||--o{ TICKET_NOTIFICATIONS : "notifies nearby"
    ORGANIZATIONS ||--o{ TICKET_NOTIFICATIONS : "receives"
    TICKETS ||--o| CAMPS : "generates upon acceptance"
    ORGANIZATIONS ||--o{ CAMPS : "hosts"
    CAMPS ||--o{ CAMP_FUNDING : "receives sponsorship"
    COMPANIES ||--o{ CAMP_FUNDING : "commits budget"
    CAMPS ||--o| CAMP_REPORTS : "documented by"
```

---

## 4. State Lifecycle Diagram (Ticket, Notification, Camp & Funding States)

```mermaid
stateDiagram-v2
    [*] --> Ticket_Open : Social Worker creates ticket
    Ticket_Open --> Ticket_Matched : Orgs found within 50km (Notifications = 'notified')
    Ticket_Open --> Ticket_Open : No orgs within 50km

    Ticket_Matched --> Ticket_Accepted : 1st Org Admin accepts (Winner = 'accepted', Others = 'expired', Camp = 'planned')
    Ticket_Matched --> Ticket_RejectedAll : All notified Org Admins reject (Notifications = 'rejected')

    Ticket_Accepted --> Ticket_Funded : CSR Admin commits budget (Funding = 'committed')
    Ticket_Funded --> Report_Submitted : Org Admin uploads report & proof (Report verified = false)
    Ticket_Accepted --> Report_Submitted : Org Admin uploads report without prior CSR funding

    Report_Submitted --> Workflow_Completed : Coordinator verifies report (Report verified = true, Camp = 'completed', Ticket = 'completed', Funding = 'utilized')
    Workflow_Completed --> [*]
    Ticket_RejectedAll --> [*]
```
