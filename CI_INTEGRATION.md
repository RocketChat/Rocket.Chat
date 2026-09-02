# Visual Regression Testing CI/CD Integration

## Best Practices
1. **Regularly Update Snapshots**: Whenever intentional changes are made to components, run `yarn approve:visual` to update the visual snapshots.
2. **Review Changes**: Always review the visual differences in the CI artifacts or Loki web interface before approving.
3. **Use Version Control**: Commit changes to visual snapshots along with the related code changes to maintain a clear history.
4. **Run Tests Frequently**: Integrate visual tests into your development workflow to catch visual regressions early.
5. **Environment Consistency**: Ensure that all team members run tests in similar environments to avoid discrepancies.
6. **Document Changes**: Keep a changelog of visual updates to help track changes over time.
7. **Handle Discrepancies**: If discrepancies arise due to different environments (e.g., Apple Silicon), document the specific conditions and adjust the tests accordingly.

## GitHub Actions Example

```yaml
name: Visual Regression Tests
on: [push, pull_request]

jobs:
  visual-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 16
      
      - name: Install dependencies
        run: yarn install
      
      - name: Build Storybook
        run: yarn build:storybook
      
      - name: Run visual tests
        run: yarn test:visual:ci
        env:
          LOKI_CI_ENDPOINT: ${{ secrets.LOKI_CI_ENDPOINT }}
          LOKI_CI_USERNAME: ${{ secrets.LOKI_CI_USERNAME }}
          LOKI_CI_PASSWORD: ${{ secrets.LOKI_CI_PASSWORD }}
```

## Approval Workflow
1. Tests will fail if visual differences are detected
2. Review differences in CI artifacts or Loki web interface
3. Approve changes by running `yarn approve:visual` locally
4. Push approved references to trigger passing CI run
