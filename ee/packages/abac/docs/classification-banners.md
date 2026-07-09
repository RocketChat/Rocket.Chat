# Classification banners (ABAC)

Renders a US-Government-style classification banner above the room header in ABAC-managed rooms, driven by a JSON configuration stored in the `ABAC_Classification_Banners_Config` admin setting (Admin → ABAC → Settings), toggled by `ABAC_Classification_Banners_Enabled`.

The banner is computed **server-side** (`GET /v1/abac/rooms/:rid/classification-banner`) from the room's `abacAttributes` and the configuration; the configuration itself is never sent to non-admin clients.

## Configuration schema

Version 1 of the configuration is described by [classification-banners.schema.json](./classification-banners.schema.json) (`$id: https://rocket.chat/schemas/classification-banners/v1.json`).

A builder page that generates valid configurations with a live preview is available at [classification-banner-builder/index.html](./classification-banner-builder/index.html) (GitHub Pages compatible — serve the file statically).

## Semantics

- **Segments**: one per attribute with `showInBanner: true`, in array order, joined by `banner.delimiter`. An attribute contributes a segment only when the room has at least one value matching one of its `values[].source` entries (matched against the room attribute whose key equals `attributes[].source`).
- **Segment text**: matched value labels joined by `valueSeparator`. With `showLabel: true` the segment is prefixed with `bannerLabel + labelSeparator`. With `sortAlpha: true` labels are sorted alphabetically. When `groupThreshold > 0` and the matched value count is ≥ the threshold, the value list collapses to `multipleLabel`.
- **Color**: the single attribute with `drivesColor: true` picks the banner background. `colorMode: "highest"` (default) selects the matched value with the highest index in that attribute's `values` array (most restrictive); `"attribute"` selects the first matched value. The foreground color is computed for readable contrast (WCAG relative luminance). If the driver attribute has no matched values, `banner.fallbackColor` is used.
- **Fallback**: when no attribute produces a segment, the banner renders `banner.fallbackText` on `banner.fallbackColor` (defaults: `NO CLASSIFICATION DATA` / `#6C727A`).
- **Styles** (`banner.style`): `classic` — single centered line; `segmented` — segments separated by vertical rules instead of the delimiter; `edge` — classic with contrasting top/bottom edge rules.
- The banner always renders above the room header.
- Config changes require no server restart; open clients pick up changes when the room is reloaded.

### Cross-field rules

These rules are part of the v1 contract and are validated by the builder page (save-time enforcement in Rocket.Chat ships separately):

- Exactly one attribute has `drivesColor: true`.
- `attributes[].id` values are unique; within an attribute, `values[].source` are unique.
- `multipleLabel` is required when `groupThreshold > 0`.
- `bannerLabel` is required when `showLabel: true`.

## Example

This configuration reproduces the design prototype's default state. For a room with `clearance.level = [TS]`, `access.programs = [SAP-1042, SAP-2271, SAP-3380]`, `dissem.relto = [USA]` it renders `TOP SECRET // SAR-APPLES/BANANAS/ORANGES // RELTO USA` on the Top Secret orange.

```json
{
  "$schema": "https://rocket.chat/schemas/classification-banners/v1.json",
  "version": 1,
  "enabled": true,
  "source": "idp",
  "banner": {
    "style": "classic",
    "uppercase": true,
    "monospace": false,
    "delimiter": " // ",
    "colorMode": "highest",
    "fallbackText": "NO CLASSIFICATION DATA",
    "fallbackColor": "#6C727A"
  },
  "attributes": [
    {
      "id": "classification",
      "source": "clearance.level",
      "label": "Classification level",
      "showInBanner": true,
      "showLabel": false,
      "bannerLabel": "",
      "labelSeparator": "",
      "valueSeparator": "/",
      "sortAlpha": false,
      "groupThreshold": 0,
      "multipleLabel": "",
      "drivesColor": true,
      "values": [
        { "source": "U",      "label": "UNCLASSIFIED",    "color": "#007a33" },
        { "source": "CUI",    "label": "CUI",             "color": "#502b85" },
        { "source": "C",      "label": "CONFIDENTIAL",    "color": "#0033a0" },
        { "source": "S",      "label": "SECRET",          "color": "#c8102e" },
        { "source": "TS",     "label": "TOP SECRET",      "color": "#ff8c00" },
        { "source": "TS-SCI", "label": "TOP SECRET//SCI", "color": "#fce100" }
      ]
    },
    {
      "id": "sar",
      "source": "access.programs",
      "label": "Special access programs",
      "showInBanner": true,
      "showLabel": true,
      "bannerLabel": "SAR",
      "labelSeparator": "-",
      "valueSeparator": "/",
      "sortAlpha": true,
      "groupThreshold": 4,
      "multipleLabel": "MULTIPLE PROGRAMS",
      "drivesColor": false,
      "values": [
        { "source": "SAP-1042", "label": "APPLES",  "color": "#c8102e" },
        { "source": "SAP-2271", "label": "BANANAS", "color": "#ff8c00" },
        { "source": "SAP-3380", "label": "ORANGES", "color": "#0033a0" },
        { "source": "SAP-4419", "label": "PEACHES", "color": "#007a33" },
        { "source": "SAP-5567", "label": "GRAPES",  "color": "#502b85" }
      ]
    },
    {
      "id": "relto",
      "source": "dissem.relto",
      "label": "Releasable to",
      "showInBanner": true,
      "showLabel": true,
      "bannerLabel": "RELTO",
      "labelSeparator": " ",
      "valueSeparator": "/",
      "sortAlpha": false,
      "groupThreshold": 0,
      "multipleLabel": "",
      "drivesColor": false,
      "values": [
        { "source": "USA",  "label": "USA",  "color": "#0033a0" },
        { "source": "FVEY", "label": "FVEY", "color": "#007a33" },
        { "source": "NATO", "label": "NATO", "color": "#502b85" }
      ]
    },
    {
      "id": "dissem",
      "source": "dissem.controls",
      "label": "Dissemination controls",
      "showInBanner": false,
      "showLabel": false,
      "bannerLabel": "",
      "labelSeparator": "",
      "valueSeparator": "/",
      "sortAlpha": true,
      "groupThreshold": 0,
      "multipleLabel": "",
      "drivesColor": false,
      "values": [
        { "source": "NF", "label": "NOFORN", "color": "#c8102e" },
        { "source": "OC", "label": "ORCON",  "color": "#ff8c00" },
        { "source": "IM", "label": "IMCON",  "color": "#0033a0" }
      ]
    }
  ]
}
```
