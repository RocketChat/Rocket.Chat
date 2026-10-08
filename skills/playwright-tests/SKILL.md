---
name: playwright-tests
description: Guides writing Playwright end-to-end tests for the Rocket.Chat application. Use when creating, editing, or reviewing Playwright test files, writing e2e specs, working with page objects, or when the user asks about test structure, locator strategy, assertions, or test organization in apps/meteor/tests/e2e/.
---

# Playwright Test Development

## When to use
Use this skill **only** when writing, editing, or reviewing **end-to-end (e2e) tests** that use the [Playwright](https://playwright.dev/) framework.  
It does **not** apply to unit, integration, or manual tests, nor to test frameworks other than Playwright.

**Typical scenarios:**
- Creating new Playwright test specs (`.spec.ts`) in `apps/meteor/tests/e2e/`
- Maintaining or improving existing e2e Playwright tests or page objects
- Reviewing e2e test code for Playwright best practices, locator usage, or code organization

If you are working with other test types or frameworks (e.g., Jest, Mocha, manual QA), refer to the appropriate skill or documentation.

## File structure

- **Test files**: `apps/meteor/tests/e2e/` — use `.spec.ts` extension (e.g. `login.spec.ts`)
- **Page objects**: `apps/meteor/tests/e2e/page-objects/` — reuse existing ones before creating new
- **Config**: `playwright.config.ts` for global settings

## Code quality

- Write concise TypeScript with accurate typing
- Use descriptive test names that communicate expected behavior
- Extract reusable logic into helper functions (DRY)
- No code comments in implementation

## Locator strategy

Prefer semantic locators — **never** use `page.locator()` directly:

| Locator | Use for |
|---------|---------|
| `page.getByRole()` | Interactive elements (buttons, links, inputs) |
| `page.getByLabel()` | Form fields |
| `page.getByText()` | Text content |
| `page.getByTitle()` | Titled elements |

Store commonly used locators in variables/constants for reuse.

## Test structure

- `test.beforeAll()` / `test.afterAll()` for setup and teardown
- `test.step()` for complex scenarios to aid readability
- Group related tests in the same file
- Use Playwright fixtures (`test`, `page`, `expect`)

## Assertions & waiting

- **Prefer web-first assertions**: `toBeVisible`, `toHaveText`, `toHaveValue`, etc.
- Use `expect` matchers (`toEqual`, `toContain`, `toBeTruthy`, `toHaveLength`) — never `assert`
- `page.waitFor()` with specific conditions — never hardcoded timeouts
- Implement proper wait strategies for dynamic content

## Architecture

- Follow Page Object Model consistently
- Maintain test isolation — clean state for each test
- Tests must run reliably in parallel without shared state conflicts
- Reuse existing test files when appropriate; create new ones when needed

## Output format

Provide:
1. Complete, runnable TypeScript test files
2. Proper import statements
3. Well-structured `describe`/`test` blocks
4. Implementation that follows all above guidelines

## Reference

- [Playwright Testing Guide](https://playwright.dev/docs/writing-tests)
- [Rocket.Chat Documentation](https://docs.rocket.chat/docs/rocketchat)
