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
