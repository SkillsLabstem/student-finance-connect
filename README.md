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
- `data/catalog.json` — sole runtime catalogue.
- `assets/` — supplied source documents.

## Content status

The initial catalogue contains sample and unverified content. Information must
be confirmed against official UTech, Jamaica sources before it is treated as
official. Do not add contacts, procedures, or form requirements without a
recorded authoritative source.

## License

Distributed under the [MIT License](./LICENSE).
