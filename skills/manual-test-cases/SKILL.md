---
name: manual-test-cases
description: Guides creation of manual test cases for the Rocket.Chat application following the team's standardized format. Use when writing, designing, or reviewing manual test cases, QA test plans, or when the user asks about test case structure, test type classification (API/E2E/Unit), preconditions, or test case templates.
---

# Manual Test Case Creation

## When to Use
Use when writing, designing, or reviewing manual test cases, QA test plans, or when the user asks about test case structure, test type classification (API/E2E/Unit), preconditions, or test case templates.

## Required context

Before creating test cases, load this reference file:
- [test-cases.json](.cursor/files/test-cases.json) — reference format and existing test case structures

## Test case format

```markdown
## Test Case: [Descriptive Title]
**Description**: [Short, clear description of what is being tested]  
**Preconditions**: [List of required setup conditions]  
**Type:** [api/e2e/unit]

**Steps**:
1. [step 1]
2. [step 2]
**Expected Result**: [Specific, measurable expected outcome]
```

## Test type classification

| Type | Use for |
|------|---------|
| `api` | Backend service testing, data validation, integration points |
| `e2e` | Complete user workflows, cross-system functionality |
| `unit` | Individual component or function testing |

## Quality requirements

- Include ALL components: Title, Description, Preconditions, Type, Steps, Expected Result
- Steps must be clear, concise, and reproducible by any team member
- Titles must be descriptive and searchable (easy to filter in reports)
- Expected results must be specific and measurable
- Focus on comprehensive feature coverage and edge case validation

## Output format

Provide:
1. Complete test cases following the exact markdown format above
2. Appropriate test type based on scope
3. Comprehensive step coverage without gaps
4. Clear, actionable instructions for manual execution
5. Specific expected results that can be validated

## Reference

- [Rocket.Chat Documentation](https://docs.rocket.chat/docs/rocketchat)
