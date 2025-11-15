# Docker Image Size Tracker

Automatically tracks and reports Docker image sizes in Pull Requests with historical trend analysis.

## Features

- 📊 **Automatic Tracking**: Measures all service image sizes after build
- 📈 **PR Comments**: Posts size comparison vs `develop` baseline
- 📉 **Historical Trends**: Tracks size evolution over time with visual charts
- 🎯 **Multi-Service**: Tracks all microservices independently
- 🔔 **Visual Reports**: Tables, graphs, and statistics
- 💾 **Persistent Storage**: Stores history in Git orphan branch

## How It Works

1. After Docker images are built and published in CI
2. Action measures sizes using `skopeo` (no image pull needed)
3. Compares against `develop` baseline
4. Loads historical data from `image-size-history` branch
5. Generates trend chart showing evolution + current PR impact
6. Posts/updates PR comment with detailed report
7. On merge to `develop`, saves measurement to history

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

📈 Historical Trend

[Mermaid chart showing last 30 builds + current PR]

Statistics (last 30 builds):
- 📊 Average: 1.19 GB
- ⬇️ Minimum: 1.15 GB
- ⬆️ Maximum: 1.25 GB
- 🎯 Current PR: 1.23 GB
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

## Historical Data

The action stores historical measurements in a Git orphan branch called `image-size-history`:

- **Automatic Storage**: When changes are merged to `develop`, measurements are saved
- **Retention**: Last 30 measurements are used for trend analysis
- **Format**: JSON files with timestamps and commit references
- **Branch Structure**: 
  ```
  image-size-history/
  ├── README.md
  └── history/
      ├── 20241115-143022.json
      ├── 20241115-150145.json
      └── ...
  ```

### Manual History Management

View history branch:
```bash
git fetch origin image-size-history
git checkout image-size-history
```

Clean old measurements:
```bash
git checkout image-size-history
rm history/old-*.json
git commit -m "Clean old measurements"
git push origin image-size-history
```

## Requirements

- `skopeo` (installed automatically)
- `jq` (installed automatically)
- `bc` (installed automatically)
- Images must be pushed to registry before tracking
- Write permissions to repository (for history storage)

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

### History not showing

- History starts accumulating after first merge to `develop`
- Requires `contents: write` permission in workflow
- Check if `image-size-history` branch exists

### No PR comment appears

Check that the workflow has permissions:

```yaml
permissions:
  pull-requests: write
```

## License

Same as Rocket.Chat project.
