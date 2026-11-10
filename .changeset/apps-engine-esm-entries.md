---
'@rocket.chat/apps-engine': minor
---

Adds ES module entry points next to the CommonJS build. `import` now resolves `@rocket.chat/apps-engine/definition/…` to modules under `esm/` that re-export the CommonJS ones, so both formats share the same classes and `instanceof` checks keep working across them. `require` loads the same modules as before, including through extensionless and directory paths such as `definition/accessors`.

The package now declares an `exports` map, which only exposes `definition/…` and `package.json`; nothing else was ever published.
