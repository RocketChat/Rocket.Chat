# Docker Image Size Tracker

Automatically tracks and reports Docker image sizes in Pull Requests.

## Features

- 📊 **Automatic Tracking**: Measures all service image sizes after build
- 📈 **PR Comments**: Posts size comparison vs `develop` baseline
- 🎯 **Multi-Service**: Tracks all microservices independently
- 🔔 **Visual Reports**: Tables with size changes and percentages

## How It Works

1. After Docker images are built and published in CI
2. Action measures sizes using `skopeo` (no image pull needed)
3. Compares against `develop` baseline
4. Posts/updates PR comment with detailed report

## Example Output

```markdown
📦 Docker Image Size Report

📈 Summary 🔴 +2.3%

| Metric | Value |
|--------|-------|
| Current Total | 1.23 GB |
| Baseline Total | 1.20 GB |
| Difference | +27.65 MB (+2.30%) |

📊 Service Details

| Service | Current | Baseline | Change |
|---------|---------|----------|--------|
| 📈 rocketchat | 850 MB | 830 MB | +20 MB |
| 📉 auth-service | 120 MB | 125 MB | -5 MB |
```

## Usage

Already integrated in `.github/workflows/ci.yml`:

```yaml
- name: Track Docker image sizes
  uses: ./.github/actions/docker-image-size-tracker
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    registry: ghcr.io
    repository: ${{ needs.release-versions.outputs.lowercase-repo }}
    tag: ${{ needs.release-versions.outputs.gh-docker-tag }}
    baseline-tag: develop
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `github-token` | Token for PR comments | Yes | - |
| `registry` | Container registry | No | `ghcr.io` |
| `repository` | Repository name | Yes | - |
| `tag` | Image tag to measure | Yes | - |
| `baseline-tag` | Baseline tag to compare | No | `develop` |
| `services` | JSON array of services | No | All services |

## Outputs

| Output | Description |
|--------|-------------|
| `total-size` | Total size in bytes |
| `size-diff` | Size difference in bytes |
| `size-diff-percent` | Size difference percentage |

## Requirements

- `skopeo` (installed automatically)
- `jq` (installed automatically)
- Images must be pushed to registry before tracking

## Customization

### Track Specific Services

```yaml
- uses: ./.github/actions/docker-image-size-tracker
  with:
    services: '["rocketchat","authorization-service"]'
```

### Use Different Baseline

```yaml
- uses: ./.github/actions/docker-image-size-tracker
  with:
    baseline-tag: 'latest'
```

## Troubleshooting

### Images not found

Ensure the job runs after images are published:

```yaml
needs: [build-gh-docker-publish, release-versions]
```

### No PR comment appears

Check that the workflow has permissions:

```yaml
permissions:
  pull-requests: write
```

## License

Same as Rocket.Chat project.
