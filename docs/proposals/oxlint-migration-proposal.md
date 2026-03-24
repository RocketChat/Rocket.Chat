# Proposal: Migrate from ESLint to oxlint

## Motivation

Rocket.Chat's current ESLint setup requires `NODE_OPTIONS="--max-old-space-size=8192"` to run, has 45+ dependencies in the `@rocket.chat/eslint-config` package, and is one of the slowest CI steps. [oxlint](https://oxc.rs/docs/guide/usage/linter.html) is a Rust-based linter that is 50-100x faster, ships with 699+ built-in rules, and has zero JavaScript dependencies.

## Current State

### ESLint Configuration

- **Format**: ESLint Flat Config (v9.39.3)
- **Centralized config**: `packages/eslint-config` (`@rocket.chat/eslint-config`)
- **Overrides**: `eslint.config.mjs` at root with 19 file-pattern override blocks
- **Explicit rules**: 174+
- **`eslint-disable` comments**: 2,934 across the codebase

### Plugins in Use

| Plugin | Active Rules | Purpose |
|--------|-------------|---------|
| `@eslint/js` | ~70 | Core JavaScript rules |
| `@typescript-eslint` | ~52 | TypeScript linting with type-checking |
| `eslint-plugin-import` | ~17 | Import/export validation |
| `eslint-plugin-react` | ~24 | React best practices |
| `eslint-plugin-react-hooks` | 2 | rules-of-hooks, exhaustive-deps |
| `eslint-plugin-jest` | ~10 | Jest testing rules |
| `eslint-plugin-jsx-a11y` | 1 | Accessibility (no-autofocus) |
| `eslint-plugin-testing-library` | ~9 | Testing Library best practices |
| `eslint-plugin-storybook` | 1 | Storybook (no-renderer-packages) |
| `eslint-plugin-anti-trojan-source` | 1 | Security (no-bidi) |
| `eslint-plugin-prettier` | - | Formatting via Prettier |
| `eslint-plugin-you-dont-need-lodash-underscore` | 76 | Enforce native JS over lodash |

## oxlint Coverage Analysis

### Rules with Full Support

| Category | RC Rules | oxlint Rules | Coverage |
|----------|----------|-------------|----------|
| ESLint core | ~70 | 200+ | 100% |
| TypeScript | ~52 | 150+ | ~95% |
| Import | ~17 | 36 | 100% |
| React | ~24 | 60+ | 100% |
| React Hooks | 2 | 2 | 100% |
| Jest | ~10 | 55+ | 100% |
| jsx-a11y | 1 | 24+ | 100% |

### Gaps (No oxlint Equivalent)

| Plugin | Rules | Impact | Alternative |
|--------|-------|--------|-------------|
| `prettier` | formatting | None | Run Prettier separately (already a best practice) |
| `you-dont-need-lodash-underscore` | 76 rules | High | Keep ESLint for this plugin only, or write custom rules |
| `testing-library` | 9 rules | Medium | Keep ESLint for test files, or accept the gap |
| `storybook` | 1 rule | Low | Accept the gap |
| `anti-trojan-source` | 1 rule | Low | oxlint has `unicorn/no-abusive-eslint-disable` but not no-bidi specifically |
| `@typescript-eslint/naming-convention` | 1 rule (302 disables) | High | oxlint does not support naming-convention with regex patterns (`I[A-Z]` for interfaces) |

### Bonus: Additional oxlint Rules

oxlint ships with plugins the project does not currently use that could add value:

- **unicorn** (140+ rules) — JS code modernization
- **react-perf** (4 rules) — React performance (jsx-no-new-object-as-prop, etc.)
- **promise** (15 rules) — Promise best practices
- **oxc** (32 rules) — specific bug detection (const_comparisons, missing_throw, etc.)

## Migration Strategy

### Phase 1: Parallel Setup (oxlint + ESLint)

Run oxlint before ESLint, disabling duplicate rules in ESLint via `eslint-plugin-oxlint`.

**Installation:**

```bash
pnpm add -D oxlint eslint-plugin-oxlint
```

**Scripts (root `package.json`):**

```jsonc
{
  "scripts": {
    "lint": "oxlint --deny-warnings && turbo run lint",
    "lint:fix": "oxlint --fix && turbo run lint -- --fix"
  }
}
```

**Integration in `eslint.config.mjs`:**

```js
import oxlint from 'eslint-plugin-oxlint';

export default [
  // ... existing configs
  oxlint.configs['flat/recommended'], // automatically disables duplicate rules
];
```

**oxlint configuration (`oxlintrc.json` at root):**

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/nicksrandall/oxlint-config/main/schema.json",
  "plugins": [
    "typescript",
    "import",
    "react",
    "react-hooks",
    "jest",
    "jsx-a11y",
    "unicorn",
    "promise",
    "oxc"
  ],
  "rules": {
    // Map rules from @rocket.chat/eslint-config
    "complexity": ["error", { "max": 31 }],
    "no-var": "error",
    "prefer-const": "error",
    "prefer-template": "error",
    "eqeqeq": ["error", "always", { "null": "ignore" }],
    "no-eval": "error",
    "no-proto": "error",
    "no-nested-ternary": "error",

    // TypeScript
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/consistent-type-imports": "error",
    "@typescript-eslint/consistent-type-exports": "error",
    "@typescript-eslint/prefer-optional-chain": "error",

    // React
    "react/jsx-key": "error",
    "react/self-closing-comp": "error",
    "react/no-multi-comp": "warn",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "error",

    // Import
    "import/no-cycle": "error",
    "import/no-self-import": "error",
    "import/no-duplicates": "error",
    "import/first": "error"
  },
  "ignorePatterns": [
    "dist",
    "node_modules",
    "coverage",
    "storybook-static",
    ".turbo"
  ]
}
```

**Expected outcome:**
- 50-100x faster linting for covered rules
- ESLint only processes remaining rules (lodash, testing-library, storybook, naming-convention)
- Zero breaking changes in CI

### Phase 2: Reduce ESLint Scope

After Phase 1 stabilizes, remove ESLint plugins that are 100% covered by oxlint:

```diff
# packages/eslint-config/package.json — remove dependencies:
- "@eslint/js"
- "eslint-plugin-import"
- "eslint-plugin-react"
- "eslint-plugin-react-hooks"
- "eslint-plugin-jest"
- "eslint-plugin-jsx-a11y"
- "eslint-import-resolver-typescript"
```

Keep only:
- `typescript-eslint` (for `naming-convention` with regex patterns)
- `eslint-plugin-you-dont-need-lodash-underscore`
- `eslint-plugin-testing-library`
- `eslint-plugin-storybook`
- `eslint-plugin-anti-trojan-source`
- `eslint-plugin-prettier` (or migrate to running Prettier separately)

**Expected outcome:**
- ESLint runs ~5x faster (fewer rules to process)
- Possible to remove `NODE_OPTIONS="--max-old-space-size=8192"`
- Fewer dependencies to maintain

### Phase 3: Evaluate Complete ESLint Removal

Decisions required:

1. **Lodash enforcement (76 rules)**: If the codebase is already lodash-free, the rules can be removed. Otherwise, evaluate whether oxlint JS plugins (alpha feature) support generic ESLint plugins by then.

2. **`naming-convention`**: Evaluate whether the rule is still needed (302 disables suggest it generates more noise than value). If kept, check whether oxlint has added support.

3. **`testing-library`**: Evaluate whether 9 rules justify keeping ESLint.

4. **Prettier**: Migrate to running as a separate step (`prettier --check .` in CI).

**Criteria for Phase 3**: oxlint JS plugins exit alpha, OR the cost of maintaining ESLint for <90 rules no longer justifies the complexity.

## CI Impact

| Metric | Current ESLint | Phase 1 (parallel) | Phase 2 (reduced ESLint) |
|--------|---------------|---------------------|--------------------------|
| Lint time (estimated) | ~3-5 min | ~2-3 min | ~30s-1 min |
| Memory | 8GB heap | 8GB (ESLint) + ~200MB (oxlint) | ~2GB (ESLint) + ~200MB (oxlint) |
| Dependencies | 45+ | 45+ (+ oxlint) | ~10 (+ oxlint) |

## Impact on `eslint-disable` Comments

The existing 2,934 `eslint-disable` comments will continue to work with ESLint. For rules migrated to oxlint, the comments become unnecessary (oxlint uses a different format). Options:

1. **Leave as-is** — ESLint ignores comments for rules it does not process; oxlint ignores ESLint-format comments
2. **Migrate gradually** — convert `// eslint-disable-next-line rule` to `// oxlint-disable-next-line rule` as files are touched
3. **Bulk migration** — use a codemod to convert all at once

Recommendation: option 1 in Phase 1, option 3 in Phase 2.

## Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| oxlint rules behaving differently from ESLint | Medium | Run both in parallel during Phase 1 and compare output |
| oxlint performance with type-checking | Low | oxlint uses tsgo (Go port of TypeScript); benchmarks show it is still faster |
| Breaking changes in oxlint (pre-1.0) | Medium | Pin version in package.json, update carefully |
| JS plugins never exit alpha | Low | Keeping ESLint for the gaps is acceptable long-term |

## References

- [oxlint docs](https://oxc.rs/docs/guide/usage/linter.html)
- [eslint-plugin-oxlint](https://github.com/oxc-project/eslint-plugin-oxlint) — disables duplicate rules
- [oxlint rules reference](https://oxc.rs/docs/guide/usage/linter/rules.html)
- [oxlint config reference](https://oxc.rs/docs/guide/usage/linter/config.html)
