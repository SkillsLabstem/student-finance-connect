# Student Finance Connect

Student Finance Connect is an independent student-built information portal for
University of Technology, Jamaica (UTech) resources. It is not an official
UTech service.

## Run locally

Use a static web server from the repository root:

```sh
python3 -m http.server 8000
```

Open [http://localhost:8000/](http://localhost:8000/) in a browser. Do not open
`index.html` with `file://`, because the application loads its catalogue with
`fetch`.

## Project structure

- `index.html` — single browser entry point and semantic page shell.
- `css/style.css` — global styles, components, responsive layout, and themes.
- `js/app.js` — data loading, rendering, search, filters, modal, copy, print,
  navigation, and theme behavior.
- `data/catalog.json` — runtime catalogue, including the 30 form links listed on
  UTech's official Forms page (indexed November 24, 2026).
- `assets/` — supplied source documents.
- `scripts/download-utech-forms.sh` — retrieves the current official PDFs into
  `assets/forms/`; run it from the repository root before deployment.

## Content status

The form directory preserves the official UTech titles, categories, and hosted
PDF links. UTech may revise resources without notice, so users should always
read the original form before submitting it. Department contacts and guidance
remain unverified unless stated otherwise.

## License

Distributed under the [MIT License](./LICENSE).

## Application structure

The app remains a dependency-free static site with `data/catalog.json` as its canonical catalogue. Feature code is separated by responsibility:

- `index.html` — page landmarks, navigation, search, directories, modal, and independent-project disclaimer.
- `css/style.css` — design tokens, theme styles, responsive layout, and component presentation.
- `js/app.js` — catalogue loading, page coordination, existing detail modal, copy/print, theme, navigation, and rendering of faculties and guidance.
- `js/modules/search.js` — normalized, ranked fuzzy form search and safe title highlighting.
- `js/modules/popularity.js` — per-browser form selection counts in localStorage.
- `js/modules/departments.js` — department selection and linked-form view.
- `data/catalog.json` — canonical forms, departments, faculties, and guidance records.
- `assets/forms/` — local copies of the linked PDFs.

### Catalogue relationship gaps

The current form records do not contain `submitTo` (or another department ID), and the department contact details are marked unverified. The department browser therefore uses only existing department IDs and reports zero linked forms until verified relationships are added to the canonical data. The current catalogue also has no separately classified general-resource records; form records retain their original source categories and are not duplicated or reclassified as resources.

Popularity is stored under `sfc-form-selection-counts-v1` on the current browser/device. It records only form IDs and positive integer selection counts. It is not site-wide analytics and is not shared with other visitors.

### Forms directory assignment metadata

The catalogue now has a `formDepartments` list with stable IDs (`general`, `welfare`, `scholarships`, and `student-finance-forms`) and an optional `directoryDepartmentId` on each assigned form. These are the development team's browsing groups; they are separate from `submitTo`, which represents an existing office-contact relationship. General is the directory default. `general-request` remains in the canonical catalogue but is excluded from the forms directory, global search, and popular-form selection.

Assigned forms: General (5), Welfare (7), Scholarships (4), Student Finance (3). Ten other forms remain unassigned because they were not included in the supplied mapping; they remain available through global search. The older 2023 Student Ambassador form is left unassigned; the current 2026 record is assigned to General.
