# Language files

To add a new language:

1. Create a new JSON file in this folder named `<code>.json` (for example `de.json`).
2. The file must include both keys:
   - `ui`: UI labels used in the settings/dashboard.
   - `presets`: default planner strings (months, days, tracker titles, etc.).
3. Add an entry in `index.json` with the same `code`, a human label, and optional `flag`/`dir`.

The app loads `/strings/index.json` to populate the picker and then fetches `/strings/<code>.json` for the selected language. If the selected language fails to load, it falls back to English.
