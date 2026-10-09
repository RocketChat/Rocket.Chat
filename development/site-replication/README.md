# Two-site example

Runs the workspace from two sites, `east` and `west`, on one machine. Each site has its own MongoDB,
RustFS and Rocket.Chat. The `interconnect` network stands for the link between the data centres.
How replication behaves is described in [the feature doc](../../docs/features/site-replication.md).

## Build an image from this branch

The published images do not contain site replication. From the repository root:

```sh
yarn install
yarn build
(cd apps/meteor && meteor build --server-only --directory /tmp/build)
docker build -f apps/meteor/.docker/Dockerfile.alpine --target release-standard -t rocketchat-site-replication:local /tmp/build
```

## Seed both sites with the same data

Both sites must start from identical databases.

```sh
cd development/site-replication
docker compose up -d mongo-east mongo-west
docker compose run --rm --service-ports -e SITE_REPLICATION_PEER_URL= rocketchat-east  # complete the setup wizard at http://localhost:3000, then stop it
docker compose exec mongo-east mongodump --archive=/tmp/seed.archive --db=rocketchat
docker compose cp mongo-east:/tmp/seed.archive ./seed.archive
docker compose cp ./seed.archive mongo-west:/tmp/seed.archive
docker compose exec mongo-west mongorestore --archive=/tmp/seed.archive
```

## Run both sites

```sh
docker compose up -d
```

East serves http://localhost:3000 and west serves http://localhost:3100. In the administration
settings of either site, set file uploads to Amazon S3 with bucket `rocketchat`. Each site's
`FileUpload_S3_BucketURL` stays local: set it to `http://rustfs-east:9000` on east and
`http://rustfs-west:9000` on west. Then link the two RustFS deployments with RustFS site replication
so uploaded files reach both sites.

## Cut the link

```sh
docker network disconnect site-replication_interconnect rocketchat-east-1
# post in the same room on both sites, wait longer than the partition threshold (30 s)
docker network connect site-replication_interconnect rocketchat-east-1
```

Both sites keep working while disconnected. After reconnecting, each site's messages from that time
appear in a thread of their own in the rooms where both sites posted.
