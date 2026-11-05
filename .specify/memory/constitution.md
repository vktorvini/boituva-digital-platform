# Boituva Digital Platform Constitution

## Core Principles

### I. Specs And Governance First
Every meaningful change must start from documented intent before code. Product vision, architecture, domain rules, and executive UX must be aligned with the project's documentation before implementation begins.

The order of authority is:
1. project vision
2. architecture
3. domain semantics
4. business and governance rules
5. UX narrative
6. code

When there is conflict, code must be updated to match the docs rather than the opposite unless the docs are intentionally amended.

### II. Public Data Pipeline Integrity
All data ingestion work must preserve source traceability and staged processing. Public data sources such as TCE-SP, IBGE, TSE, PNCP, and municipal portals must follow a reproducible flow from collection to analytical consumption.

The minimum engineering flow is:
- source acquisition with source identification
- raw preservation
- transformation through bronze, silver, and gold layers
- logging and failure visibility
- readiness for dashboard, analysis, and future AI use

No feature may bypass provenance or silently overwrite raw public data artifacts.

### III. Executive Decision Support Over Cosmetic UI
The platform exists to support municipal decision-making, not to produce isolated dashboards. Every interface must communicate situation, risk, trend, and follow-up actions in a way that serves governance and executive reading.

UI work must respect domain semantics and avoid:
- decorative features without decision value
- charts disconnected from source definitions
- mixing domain rules into presentation without documentation

### IV. Incremental Delivery With Realistic Scope
The project must start small, prove value, and scale with discipline. Features should be sliced into coherent increments that strengthen the financial and governance foundation before expanding to new municipal domains or secretariats.

Prefer:
- the smallest viable increment with analytical value
- modular collectors and pipelines
- specs that define explicit problem, user, objective, and expected outcome

Reject scope that adds complexity without a clear operational pain point.

### V. Documentation And Verification Are Part Of The Deliverable
Changes are not complete when code compiles; they are complete when behavior, constraints, and operating guidance are clear. New flows, integrations, and domain changes must leave behind enough documentation and validation to be reusable by future contributors and agents.

At minimum, work should update the relevant spec, implementation notes, or operational guidance whenever behavior or assumptions materially change.

## Project Constraints

- The repository is a multi-surface platform composed of a dashboard/application layer and a public-data pipeline layer.
- Existing project documents in `README.md`, `apps/dashboard/docs/README.md`, and `pipeline/boituva-tce-pipeline/README.md` define the working intent and must be consulted before structural changes.
- Python, `uv`, Git, and the local AI coding workflow are required project tooling for spec-driven work.
- New work should favor compatibility with Windows development while remaining portable where practical.
- Sensitive or personally identifiable data must not be introduced casually; public-sector governance requires aggregation, traceability, and caution.

## Development Workflow

Use this sequence for significant work:
1. establish or amend constitutional/project principles with `$speckit-constitution` when needed
2. create or refine the feature specification with `$speckit-specify`
3. clarify ambiguity with `$speckit-clarify` when requirements are incomplete
4. derive the implementation approach with `$speckit-plan`
5. generate actionable work with `$speckit-tasks`
6. optionally run `$speckit-analyze` or `$speckit-checklist` for quality control
7. implement only after the above artifacts reflect the intended change

For any feature affecting data ingestion, schema, metrics, or executive dashboards, the spec must explicitly state:
- source or business domain involved
- expected analytical output
- data lineage expectations
- UX or stakeholder impact

## Governance

This constitution governs spec-driven work for the repository and supersedes undocumented habits.

Amendments require:
1. a deliberate update to this file
2. alignment with the project documentation
3. a clear reason for the change

All implementation plans and reviews should check for compliance with these principles before approving substantial changes.

**Version**: 1.0.0 | **Ratified**: 2026-04-06 | **Last Amended**: 2026-04-06
