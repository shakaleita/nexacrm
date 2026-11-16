# HTTP interface

Main operations:

- `GET/POST /api/companies`
- `GET/POST /api/contacts`
- `GET/POST /api/deals`
- `PATCH /api/deals/:id`
- `GET/POST /api/activities`
- `PATCH /api/activities/:id/done`

Additional read-only endpoints:

- `GET /api/insights` — aggregated product metrics
- `GET /api/health` — dependency/availability probe

These endpoints are demonstration APIs; no public authentication is implemented. See source and tests for payload fields and status codes.
