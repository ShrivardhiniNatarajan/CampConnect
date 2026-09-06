# CampConnect

## Overview
CampConnect is a DBMS coursework Phase-0 MVP platform connecting social workers, NGOs/hospitals (organizations), CSR (Corporate Social Responsibility) entities, and administrative coordinators to organize health camps efficiently.

## Problem Statement
Organizing rural or community health camps often suffers from disjointed communication. Social workers find it hard to identify nearby hospitals willing to run a camp, and hospitals struggle to secure CSR funding to execute them.

## Objectives
- Allow social workers to request health camps based on geo-location.
- Spatially match tickets with nearby organizations.
- Facilitate transactional CSR funding for accepted camps.
- Ensure verifiable camp reporting with proof photos.

## Scope / Exclusions
This is an MVP meant for DBMS coursework. The following are EXPLICITLY out of scope:
- Payment gateways (Razorpay/Stripe)
- Doctor or patient medical record tracking
- Medicine inventory
- MongoDB / NoSQL data storage (aside from Cloudinary for photos)
- External SMS/Push services (Twilio/FCM)

## Features & User Roles
1. **Social Worker**: Creates tickets for health camps and views ticket status.
2. **Org Admin**: Receives geospatial notifications for tickets, accepts them, and submits completion reports (with photos).
3. **CSR Admin**: Reviews accepted camps and commits funding budget.
4. **Coordinator**: Reviews and verifies completed camp reports.

## Architecture
**Frontend**: React, Vite, Tailwind CSS, React Router, Axios, Leaflet (`react-leaflet`).
**Backend**: Node.js, Express, `mysql2` (raw SQL queries), JWT, bcrypt, Multer + Cloudinary (for proof upload).
**Storage**: MySQL 8.0+ (InnoDB) handling all relational and spatial data.

## Database Design
The application utilizes exactly nine tables in MySQL:
1. `users`: Stores all system users and roles.
2. `organizations`: Stores NGO/Hospital profiles with spatial coordinates (`location`).
3. `pincode_lookup`: Seeded table for coordinate lookup.
4. `tickets`: Health camp requests created by social workers.
5. `ticket_notifications`: Join table linking tickets to matched organizations.
6. `camps`: Created when an organization accepts a ticket.
7. `companies`: CSR entity profiles containing budget limits.
8. `camp_funding`: Tracks funding committed to specific camps.
9. `camp_reports`: Completion reports submitted by org admins, pending coordinator verification.

### Relationships
- `users` 1:N `organizations`, `companies`, `tickets`, `camp_reports`
- `tickets` 1:N `ticket_notifications`, 1:1 `camps`
- `organizations` 1:N `ticket_notifications`, `camps`
- `camps` 1:N `camp_funding`, 1:1 `camp_reports`
- `companies` 1:N `camp_funding`

## Spatial Matching
The system utilizes MySQL's `POINT` datatype with `SRID 4326`. When a social worker creates a ticket, the backend uses `ST_Distance_Sphere(location, POINT(lon, lat))` to find organizations within a given radius, ordered by distance. A spatial index on `organizations.location` ensures queries remain performant.

## Transactions
Database integrity is enforced using InnoDB transactions with row-level locking (`FOR UPDATE`):
1. **Ticket Acceptance**: Locks the ticket to prevent multiple organizations from accepting the same request concurrently.
2. **CSR Funding**: Locks the company record to enforce budget constraints and prevent over-commitment via race conditions.
3. **Report Verification**: Updates multiple tables (`camp_reports`, `camp_funding`, `camps`, `tickets`) in a single transaction, rolling back on any failure.

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- MySQL (v8.0+)
- Cloudinary Account (for photo uploads)

### Database Setup
1. Create a MySQL database named `campconnect`.
2. Run `database/schema.sql` to generate the 9 tables.
3. Run `database/seed.sql` to populate the `pincode_lookup` table.
4. (Optional) Insert test users or use the application's registration flow.

### Backend Setup
1. `cd server`
2. `npm install`
3. Copy `.env.example` to `.env` and fill in database credentials, JWT secret, and Cloudinary keys.
4. `npm run dev`

### Frontend Setup
1. `cd client`
2. `npm install`
3. `npm run dev`

## End-to-End Demo Workflow
1. **Register/Login**: Authenticate as a social worker, org admin, csr admin, and coordinator.
2. **Create Ticket**: Social worker submits a ticket with location.
3. **Accept Ticket**: Org admin views notification and accepts it. A camp is generated.
4. **Fund Camp**: CSR admin sees the fundable camp and commits funding.
5. **Submit Report**: Org admin submits a report with a Cloudinary photo upload.
6. **Verify Report**: Coordinator verifies the report, marking the workflow as completed.

## Testing and Documentation
Detailed documentation on spatial indexing `EXPLAIN` results, safe rollback methodology, and concurrency demonstrations can be found in `docs/DBMS_TESTING.md`. Testing endpoints can be done using the included `CampConnect.postman_collection.json`.
