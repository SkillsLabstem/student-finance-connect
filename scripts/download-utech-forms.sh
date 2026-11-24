#!/usr/bin/env sh
# Downloads the UTech files referenced in data/catalog.json into assets/forms.
# Run from the repository root: sh scripts/download-utech-forms.sh
set -eu

mkdir -p assets/forms

node -e '
  const forms = require("./data/catalog.json").forms;
  forms.forEach((form) => console.log(form.fileName + "\t" + form.sourceUrl));
' | while IFS="	" read -r form_id source_url; do
  destination="assets/forms/${form_id}"
  printf 'Downloading %s...\n' "$form_id"
  curl --fail --location --retry 2 --retry-delay 1 --output "$destination" "$source_url"
done
