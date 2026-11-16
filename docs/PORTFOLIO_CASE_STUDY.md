# NexaCRM — Engineering Case Study & Quality Roadmap

**Portfolio:** [Digital Solution9](https://github.com/shakaleita/teamforge-saas/blob/main/PORTFOLIO.md) · **Repository:** [Source](https://github.com/shakaleita/nexacrm)  
**Stack:** Node.js, Express, SQLite · **Status:** Local portfolio MVP; not certified production software.

## Implemented domain workflow
Companies, contacts, deals, follow-ups and read-only business reporting.

## Domain invariants
A contact must refer to a valid company; deal stage transitions and currency values must remain consistent; follow-up ownership must not leak between accounts.

## Verification backlog (not yet proven)
- Reject cross-company contact references and invalid deal stages
- Check filtering and aggregations against known fixture totals
- Test authorisation across two simulated accounts

## High-value engineering upgrades
1. Implement user/organisation permissions on every CRM route
2. Introduce migrations and transaction-safe stage history
3. Add e2e sales workflow and audit logging

## Production release gate

Verify authentication and authorization, concurrency and rollback scenarios, schema migrations, CI and browser tests, backup/restore, synthetic-data staging deployment, accessibility, security review, and reproducible performance measurements. The current README describes a local MVP and should remain honest until this evidence is available.

**Scope:** The improvement list is a plan; it does not claim implementations or tests already exist.
