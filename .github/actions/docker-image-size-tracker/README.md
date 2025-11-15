# Docker Image Size Tracker

Automatically tracks and reports Docker image sizes in Pull Requests with historical trend analysis.

## Features

- 📊 **Automatic Tracking**: Captures image sizes during build (no remote inspection)
- 📈 **PR Comments**: Posts size comparison vs `develop` baseline
- 📉 **Historical Trends**: Tracks size evolution over time with visual charts
- 🎯 **Multi-Service**: Tracks all microservices independently
- 🔔 **Visual Reports**: Tables, graphs, and statistics
- 💾 **Persistent Storage**: Stores history in Git orphan branch
- ⚡ **Fast**: Reads sizes from build artifacts instead of remote registry

## How It Works

1. During Docker build, image manifest is inspected and saved to artifacts
2. Manifest contains digest, config size, and all layer sizes
3. After images are published in CI, the tracker action runs
4. Downloads manifest artifacts from all builds (multi-arch)
5. **Automatically discovers services** by scanning artifact directories (same logic as publish workflow)
6. Calculates sizes from manifests (config + sum of layers)
7. Compares against `develop` baseline (fetched from registry)
8. Loads historical data from `image-size-history` branch
9. Generates trend chart showing evolution + current PR impact
10. Posts/updates PR comment with detailed report
11. On merge to `develop`, saves measurement to history

## Advantages

- **Faster**: No need to pull or inspect images remotely
- **Accurate**: Sizes calculated from exact manifests at build time
- **Reliable**: Works even if registry is slow or rate-limited
- **Efficient**: Uses build artifacts already available in the workflow
- **Complete**: Full manifest data preserved for future analysis
- **Dynamic**: Automatically tracks all built services without configuration
- **Consistent**: Single-platform comparison ensures fair baseline comparison

### Why Single Platform Comparison?

Comparing a single platform (arm64 by default) instead of multi-arch total provides:

1. **Fair Comparison**: Changes in one architecture don't mask issues in another
2. **Consistency**: Same platform compared across PR and baseline
3. **Simplicity**: Easier to understand what changed
4. **Focus**: arm64 is the primary production platform

If you need to track both architectures, run the action twice with different `platform` values.

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
    platform: arm64  # Optional: defaults to arm64
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `github-token` | Token for PR comments | Yes | - |
| `registry` | Container registry | No | `ghcr.io` |
| `repository` | Repository name | Yes | - |
| `tag` | Image tag to measure | Yes | - |
| `baseline-tag` | Baseline tag to compare | No | `develop` |
| `platform` | Platform architecture (amd64 or arm64) | No | `arm64` |

**Notes:** 
- Services are automatically discovered from build artifacts
- Comparison is done for a **single platform** (not total multi-arch size)
- Default platform is `arm64` for consistency

## Outputs

| Output | Description |
|--------|-------------|
| `total-size` | Total size in bytes (for specified platform) |
| `size-diff` | Size difference in bytes (for specified platform) |
| `size-diff-percent` | Size difference percentage |

## Data Structure

The build action saves complete image manifests in artifacts:

```
/tmp/digests/
├── rocketchat/
│   ├── amd64/
│   │   └── manifest.json      # Complete image manifest
│   └── arm64/
│       └── manifest.json
├── authorization-service/
│   ├── amd64/
│   │   └── manifest.json
│   └── arm64/
│       └── manifest.json
...
```

Each `manifest.json` contains the full verbose manifest from `docker manifest inspect -v`:
```json
{
  "Ref": "ghcr.io/rocketchat/rocket.chat@sha256:...",
  "Descriptor": {
    "mediaType": "application/vnd.docker.distribution.manifest.v2+json",
    "digest": "sha256:...",
    "size": 1234
  },
  "SchemaV2Manifest": {
    "schemaVersion": 2,
    "mediaType": "application/vnd.docker.distribution.manifest.v2+json",
    "config": {
      "mediaType": "application/vnd.docker.container.image.v1+json",
      "size": 12345,
      "digest": "sha256:..."
    },
    "layers": [
      {
        "mediaType": "application/vnd.docker.image.rootfs.diff.tar.gzip",
        "size": 123456,
        "digest": "sha256:..."
      },
      {
        "mediaType": "application/vnd.docker.image.rootfs.diff.tar.gzip",
        "size": 234567,
        "digest": "sha256:..."
      }
    ]
  }
}
```

Total size is calculated as: `SchemaV2Manifest.config.size + sum(SchemaV2Manifest.layers[].size)`

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

- `jq` (installed automatically)
- `bc` (installed automatically)
- Docker CLI with manifest support
- Images must be built before tracking
- Build artifacts with manifest.json files
- Write permissions to repository (for history storage)

## Customization

### Compare Different Platform

```yaml
- uses: ./.github/actions/docker-image-size-tracker
  with:
    platform: 'amd64'
```

### Use Different Baseline

```yaml
- uses: ./.github/actions/docker-image-size-tracker
  with:
    baseline-tag: 'latest'
```

### Track Both Platforms

```yaml
- name: Track arm64 sizes
  uses: ./.github/actions/docker-image-size-tracker
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    platform: arm64

- name: Track amd64 sizes  
  uses: ./.github/actions/docker-image-size-tracker
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    platform: amd64
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
