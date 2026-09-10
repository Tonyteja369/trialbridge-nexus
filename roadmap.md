# ClinQSphereX roadmap

## Now — premium biomedical liquid interface
- [x] Cinematic violet/white landing experience with strategic liquid-glass surfaces
- [x] Uploaded DNA video used as the cinematic background with poster and reduced-motion fallback
- [x] Premium biomedical media display and cardiovascular research centerpiece
- [x] Immersive glass authentication and research workspace styling
- [ ] Scientific visualization upgrades for candidate review and Quantum Lab
- [x] Footer creator credits and updated public navigation
- [ ] Desktop/mobile, interaction, accessibility, console, and route verification

## Now — rebrand + design system (this turn)
- [x] Rename ClinQSphereX → ClinQSphereX everywhere (nav, titles, metadata, copy)
- [x] Arctic Signal palette as semantic tokens (#0DB8D3 #1B7FDC #065B98 #193546)
- [x] Sora headings + Manrope body
- [x] Glass surfaces, depth, restrained motion
- [x] Procedural WebGL diagnostic sphere hero (R3F/Drei/Three) with static + reduced-motion fallback
- [x] Language rules: "potentially eligible", "researcher review required", "model prediction", no compliance claims

## Done — disease-centred website
- [x] Disease explorer (8 areas) + per-disease pages at /diseases and /diseases/$slug
- [x] Live ClinicalTrials.gov v2 discovery (no fabricated counts; error/empty states)
- [x] Home rebuilt: hero, challenge, disease explorer, heart demo, story flow, benchmark (Not evaluated), data-scale with sources, genomics chain, explainability, human review, governance, CTA
- [x] Provenance tags: live / reference / controlled / synthetic

## Next — screening + evidence honesty
- [ ] Three-state criterion display: MATCH / NOT MATCHED / UNKNOWN (never coerce UNKNOWN)
- [ ] Criterion → evidence value → source → timestamp → result on candidate review
- [ ] Review decisions: Approve / Needs Review / Not Eligible / Request Information
- [ ] Quantum Lab page: classical vs quantum benchmark, experiment records, no advantage claims
- [ ] Standards map with IMPLEMENTED / ARCHITECTED / ROADMAP labels

## Later
- [ ] Participant lifecycle states + consent versioning / re-consent impact
- [ ] Visits, tasks, documents, potential protocol deviations, risk + CAPA
- [ ] Data quality dashboard computed from real stored data
- [ ] Model/experiment registry with model, dataset, feature versions
- [ ] Governance center: roles, tenant scoping, retention per study, IEC states

## Blocked / out of scope for this app
- FastAPI/Python backend, Docker deploy: app runs on the current stack; Qiskit work stays in the `quantum` folder
- Real FHIR/Synthea ingestion pipeline: needs data source decision from the user
