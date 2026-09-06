# DBMS Testing Documentation

This document covers the testing requirements outlined in the coursework specification.

## 1. Spatial EXPLAIN Demonstration

The system uses `ST_Distance_Sphere` to match tickets with nearby organizations. A spatial index is crucial for performance.

### Without Spatial Index
If we drop the spatial index on `organizations(location)` and run an `EXPLAIN` on the geo-matching query, MySQL must scan all rows.
```sql
ALTER TABLE organizations DROP INDEX location;

EXPLAIN SELECT org_id, name, ST_Distance_Sphere(location, ST_SRID(POINT(78.9629, 20.5937), 4326)) / 1000 AS distance_km
FROM organizations
WHERE ST_Distance_Sphere(location, ST_SRID(POINT(78.9629, 20.5937), 4326)) <= 50
ORDER BY distance_km ASC;
```
**Observation**: The `type` column shows `ALL`, meaning a full table scan was performed. The `rows` column will show the total number of rows in the table. This is highly inefficient as the database grows.

### With Spatial Index
Restoring the spatial index:
```sql
ALTER TABLE organizations ADD SPATIAL INDEX (location);

EXPLAIN SELECT org_id, name, ST_Distance_Sphere(location, ST_SRID(POINT(78.9629, 20.5937), 4326)) / 1000 AS distance_km
FROM organizations
WHERE ST_Distance_Sphere(location, ST_SRID(POINT(78.9629, 20.5937), 4326)) <= 50
ORDER BY distance_km ASC;
```
**Observation**: The `type` column will show `range` or `ref`, and the `key` column will indicate that the spatial index was used. The `rows` examined drops significantly to only those falling within the bounding box filter.

## 2. Safe Rollback Demonstration

The `verifyReport` transaction involves multiple updates to `camp_reports`, `camp_funding`, `camps`, and `tickets`. If any step fails, all changes must be reverted.

**Methodology**:
We added a conditional error trigger in the `verifyReport` controller logic:
```javascript
// In reportController.js
if (req.query.simulate_error === 'true') {
  throw new Error('ROLLBACK_TEST_ERROR');
}
```

**Testing Steps**:
1. Ensure a camp report exists in the `pending` state.
2. Check the database to confirm `verified = FALSE` for the report, and the camp status is `completed` (it should still be `ongoing` or `planned`).
3. Send a `POST /api/reports/:id/verify?simulate_error=true` request as a Coordinator.
4. The API returns a `500 Internal Server Error`.
5. Check the database again. 

**Observation**:
Because of the `connection.rollback()` in the `catch` block, none of the updates (report verification, camp completion, funding utilization, ticket completion) were persisted. The state remains identical to step 2.

## 3. Concurrency Demonstrations

### Ticket Acceptance (First Organization Wins)
The `acceptNotification` endpoint uses `SELECT ... FOR UPDATE` to lock the ticket. If two organizations attempt to accept the same ticket simultaneously, MySQL forces the second transaction to wait until the first commits. 
Once the first commits, the ticket status changes to `accepted`. The second transaction then resumes, sees the status is no longer `matched`, and immediately aborts with a 409 Conflict. This prevents duplicate camps from being created for a single ticket.

### CSR Funding (Budget Protection)
The `commitFunding` endpoint uses `SELECT ... FOR UPDATE` on the company record. If two concurrent requests try to fund camps from the same company budget, they are processed serially. 
This ensures the `csr_budget_committed` check (`committed + amount <= total`) is always perfectly accurate and a race condition cannot bypass the budget constraint.
