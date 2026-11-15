---
'@rocket.chat/meteor': major
---

**Breaking:** Stopped transpiling webhook integration scripts with Babel. Scripts now run as-is inside `isolated-vm` (modern V8).

Class method bodies are now in strict mode per the ES2015 spec. Scripts that relied on sloppy-mode behaviors provided by the previous Babel transpilation must be updated:

- **Implicit globals** — `msg = buildMessage(...)` inside a class method now throws `ReferenceError`. Add `let`, `const`, or `var`.
- **`this` in nested regular functions** — `function helper() { this.JSON.stringify(...) }` now has `this === undefined` instead of `globalThis`. Use arrow functions or pass the dependency explicitly.
- **`arguments.callee`** — Throws `TypeError`. Use a named function expression instead.
- **Octal literals** — `0777` is now a `SyntaxError`. Use `0o777`.
- **Duplicate parameter names** — `function(a, a) {}` is now a `SyntaxError`.
