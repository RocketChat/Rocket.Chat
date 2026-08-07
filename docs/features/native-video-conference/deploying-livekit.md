# Deploying LiveKit + on-demand Egress to AWS

Two CloudFormation stacks:

- **`core.yaml`** — LiveKit server + Redis + Caddy (auto-TLS) on a small EC2.
  Always on. Cheap (~$15/mo for `t4g.small`). Also runs a tiny scaler
  script that polls LK every 5s and drives the egress ASG.
- **`egress.yaml`** — Auto Scaling Group (min=0, max=1) of egress workers.
  Scaling is driven by the scaler running on the core box, not by webhooks
  or Lambda — so deploy is a single shot per stack, no chicken-and-egg.

Cross-stack wiring is via `Fn::ImportValue` (VPC, subnet, private IP of the
core box for Redis, public domain for the egress worker's `ws_url`). The
ASG name is by convention: `${CoreStackName}-egress-asg`. core.yaml's IAM
role grants `SetDesiredCapacity` on exactly that name.

## Prerequisites

- **AWS CLI** configured (`aws sts get-caller-identity` must work).
- **Permissions**: `cloudformation:*`, `ec2:*`, `iam:*`, `autoscaling:*`.
- **A domain you control** — Caddy provisions Let's Encrypt certs, which
  requires a publicly resolvable A record.

## 1. Generate LiveKit credentials

```sh
LK_KEY=$(openssl rand -hex 16)
LK_SECRET=$(openssl rand -hex 32)
echo "LIVEKIT_API_KEY=$LK_KEY"
echo "LIVEKIT_API_SECRET=$LK_SECRET"
```

Same values get passed to both stacks AND into Rocket.Chat workspace settings.

## 2. EC2 key pair

```sh
REGION=us-east-1
KEYNAME=livekit-test

aws ec2 create-key-pair \
  --region "$REGION" \
  --key-name "$KEYNAME" \
  --key-type ed25519 \
  --query 'KeyMaterial' --output text \
  > ~/.ssh/$KEYNAME.pem
chmod 600 ~/.ssh/$KEYNAME.pem
```

## 3. Choose a VPC

The template can create a new VPC, but most corporate AWS accounts sit near
the per-region VPC quota (default 5). If deploy fails with
`The maximum number of VPCs has been reached`, reuse an existing public VPC.

```sh
# VPCs
aws ec2 describe-vpcs --region "$REGION" \
  --query 'Vpcs[].[VpcId,CidrBlock,IsDefault,Tags[?Key==`Name`].Value|[0]]' \
  --output table

# Subnets — pick one with MapPublicIpOnLaunch=true
aws ec2 describe-subnets --region "$REGION" \
  --query 'Subnets[].[VpcId,SubnetId,AvailabilityZone,CidrBlock,MapPublicIpOnLaunch,Tags[?Key==`Name`].Value|[0]]' \
  --output table

# Confirm subnet routes 0.0.0.0/0 to an IGW (not a NAT)
aws ec2 describe-route-tables --region "$REGION" \
  --filters "Name=association.subnet-id,Values=<subnet-id>" \
  --query 'RouteTables[].Routes[?DestinationCidrBlock==`0.0.0.0/0`].[GatewayId,NatGatewayId]' \
  --output text
# Expected: igw-... in column 1, empty column 2.
```

**Both stacks must use the same VPC + subnet.** Note the IDs now.

## 4. Deploy `core.yaml`

```sh
aws cloudformation deploy \
  --region "$REGION" \
  --stack-name livekit-core \
  --template-file deploy/livekit/core.yaml \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    Domain=livekit.dev.example.com \
    AdminEmail=you@example.com \
    LiveKitApiKey=$LK_KEY \
    LiveKitApiSecret=$LK_SECRET \
    KeyPairName=$KEYNAME \
    ExistingVpcId=vpc-xxxxxxxxxxxx \
    ExistingPublicSubnetId=subnet-xxxxxxxxxxxx
```

Drop `ExistingVpcId` / `ExistingPublicSubnetId` to provision a fresh VPC.

Takes ~3-5 min. CloudFormation waits for `cfn-signal` from the in-instance
bootstrap, so `CREATE_COMPLETE` means LK + Redis + Caddy + the scaler are
all running. The scaler is already polling LK; until egress.yaml is up, its
`SetDesiredCapacity` calls will fail (ASG doesn't exist yet) — that's fine.

Get the EIP:

```sh
aws cloudformation describe-stacks --region "$REGION" \
  --stack-name livekit-core \
  --query 'Stacks[0].Outputs' --output table
```

## 5. DNS

Create an A record `livekit.dev.example.com → <PublicIP>` (TTL 60 while
iterating). Wait until it resolves:

```sh
dig +short livekit.dev.example.com
```

If the Caddy cert isn't valid within ~60s of DNS propagating, restart Caddy
(it backed off after the initial NXDOMAIN — see Troubleshooting).

## 6. Deploy `egress.yaml`

```sh
aws cloudformation deploy \
  --region "$REGION" \
  --stack-name livekit-egress \
  --template-file deploy/livekit/egress.yaml \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    CoreStackName=livekit-core \
    LiveKitApiKey=$LK_KEY \
    LiveKitApiSecret=$LK_SECRET \
    KeyPairName=$KEYNAME
```

That's it — no follow-up redeploy needed. Within ~5s of `CREATE_COMPLETE`,
core's scaler picks up the ASG and starts driving it.

## 7. Point Rocket.Chat at it

Workspace settings (Admin → Video Conference → LiveKit):

- `VideoConf_LiveKit_URL`: `wss://livekit.dev.example.com`
- `VideoConf_LiveKit_APIKey`: `$LK_KEY`
- `VideoConf_LiveKit_APISecret`: `$LK_SECRET`

## 8. Verify end-to-end

Start a call in Rocket.Chat. Within ~2-3 minutes:

```sh
ASG=$(aws cloudformation describe-stacks --region "$REGION" \
  --stack-name livekit-egress \
  --query 'Stacks[0].Outputs[?OutputKey==`AsgName`].OutputValue' --output text)

# Watch ASG capacity flip 0 -> 1
aws autoscaling describe-auto-scaling-groups --region "$REGION" \
  --auto-scaling-group-names "$ASG" \
  --query 'AutoScalingGroups[0].[DesiredCapacity,length(Instances)]' --output text
```

End the call. Within ~5-10s (one scaler poll + the `SetDesiredCapacity`
call) the instance is marked for termination.

## Architecture

```
                 Rocket.Chat client
                        │ wss
                        ▼
    ┌───────────────────────────────────────────────────┐
    │ core.yaml (always on, ~$15/mo)                    │
    │                                                   │
    │   livekit-server  +  redis  +  caddy              │
    │   t4g.small (2 vCPU / 2 GB RAM)                   │
    │                                                   │
    │   scale-egress.py (systemd) ──┐                   │
    │     poll LK every 5s          │                   │
    │     on count change:          │                   │
    │       aws autoscaling         │                   │
    │       set-desired-capacity ───┼──────┐            │
    └───────────────────────────────│──────│────────────┘
              ▲ Twirp + Redis       │      │
              │ (over VPC)          │      │
              │                     ▼      ▼
    ┌─────────│────────────────────────────────────────┐
    │ egress.yaml (on demand)                          │
    │                                                  │
    │   ASG min=0/max=1                                │
    │   t4g.xlarge (4 vCPU / 16 GB RAM)                │
    │   Boots when scaler sets desired=1               │
    │                                                  │
    │   livekit/egress container                       │
    └──────────────────────────────────────────────────┘
```

No Lambda, no API Gateway, no webhook. The whole loop is local on core +
one AWS call per state transition.

## Cost picture

| Component | $/mo (idle) | $/hr (active) |
|---|---|---|
| Core EC2 (`t4g.small`, on 24/7) | ~$12 | — |
| Core EBS (20 GB gp3) | ~$1.60 | — |
| Caddy / cert / DNS | $0 | $0 |
| Egress EC2 (`t4g.xlarge`) | $0 | ~$0.134 |
| Egress EBS (30 GB gp3, attached only while up) | $0 | ~$0.003 |
| AWS API calls (SetDesiredCapacity only) | $0 | $0 |
| **Total** | **~$14/mo** | **+~$0.14/hr per recording-active call** |

For sporadic test calls, monthly bill is dominated by the always-on core
stack (~$14/mo).

## Cold start

When the first room starts in an empty cluster:

```
Local LK poll (5s avg)  ──>  scaler sees count = 1  ──>  SetDesiredCapacity(1)
                                                                │
                                                                ▼
              EC2 launch + cloud-init + Docker pull (~60-90s)
                                                                │
                                                                ▼
                              egress container + register with LK (~30s)
                                                                │
                                                                ▼
                                        ready for StartEgress (~2 min total)
```

If a user clicks Record within the first ~2 min of a call, `StartEgress`
will return `503 unavailable`. Two options to handle:

- **Wait it out** — Rocket.Chat's recording UI retries on failure.
- **Pre-bake an AMI** with Docker + the egress image already pulled. Cuts
  ~60s off the cold start. Out of scope here.

## Troubleshooting

### Stack stuck in `ROLLBACK_COMPLETE`
That state can't be updated. Delete first, then redeploy:
```sh
aws cloudformation delete-stack --stack-name <stack>
aws cloudformation wait stack-delete-complete --stack-name <stack>
```

### "Maximum number of VPCs has been reached"
Reuse an existing VPC (step 3) or request a quota increase:
```sh
aws service-quotas request-service-quota-increase \
  --service-code vpc --quota-code L-F678F1CE --desired-value 10
# ~24h to take effect
```

### `cloudformation..amazonaws.com` (double dot)
`$REGION` is unset. `export REGION=us-east-1` or pass `--region` literally.

### `tlsv1 alert internal error` from curl to the core domain
Caddy doesn't have a valid cert yet. Either:
- DNS still propagating — wait a few minutes
- LE failed earlier (NXDOMAIN at the time) — Caddy is in backoff; restart
  Caddy to retry:
  ```sh
  ssh -i ~/.ssh/$KEYNAME.pem ec2-user@<core-ip>
  sudo docker compose -f /opt/livekit/docker-compose.yml restart caddy
  sudo docker compose -f /opt/livekit/docker-compose.yml logs -f caddy
  # Watch for: "certificate obtained successfully"
  ```

### LE rate limit hit (5 failures/hostname/hour)
Switch to LE *staging* (untrusted but unlimited) while debugging. SSH in
and edit `/opt/livekit/Caddyfile` global block:
```
{
  email you@example.com
  acme_ca https://acme-staging-v02.api.letsencrypt.org/directory
}
```
Then `docker compose restart caddy`. Browsers warn; `curl -k` works.

### ASG stays at 0 forever after starting a call
Tail the scaler log on core:
```sh
ssh -i ~/.ssh/$KEYNAME.pem ec2-user@<core-ip>
sudo journalctl -u lk-scaler -f
```
- No output at all → service didn't start. Check `systemctl status lk-scaler`.
- `lk_post ... failed` → LK server is unreachable on localhost:7880. Check
  `docker ps` for livekit-server.
- `active=0 desired=0` even though a call is up → LK doesn't see the room.
  Check the LK client is actually connected.
- `SetDesiredCapacity` errors in the log → IAM grant mismatch. The role's
  inline policy targets `${StackName}-egress-asg` — confirm egress.yaml
  used the same `CoreStackName` value.

### Egress instance boots but doesn't register with LK
SSH into the egress instance and check it can reach Redis on the core box:
```sh
aws ec2 describe-instances --region $REGION \
  --filters "Name=tag:Name,Values=livekit-core-egress" \
            "Name=instance-state-name,Values=running" \
  --query 'Reservations[0].Instances[0].PublicIpAddress' --output text

ssh -i ~/.ssh/$KEYNAME.pem ec2-user@<egress-ip>
nc -zv <core-private-ip> 6379
# Connection to <ip> 6379 port [tcp/redis] succeeded!
```
If timeout, the cross-SG ingress rule is broken — check the egress
instance is a member of `EgressClientsSG`.

### Recording fails with `twirp error unknown: no response from servers`
Egress isn't online yet. Either it hasn't finished booting (give it 2-3
min after call start) or it crashed:
```sh
sudo docker compose -f /opt/egress/docker-compose.yml logs --tail=100 egress
```
The `not enough cpu` error means InstanceType is too small — bump to
`t4g.2xlarge` or `c7g.xlarge` (and redeploy egress.yaml).

### Call joins but no media
UDP 50000-60000 inbound is needed for WebRTC media on the core box. If you
used an existing VPC, a NACL there may be denying that range. Check:
```sh
aws ec2 describe-network-acls --region "$REGION" \
  --filters "Name=association.subnet-id,Values=<subnet-id>" \
  --query 'NetworkAcls[].Entries[?Egress==`false`].[RuleNumber,Protocol,PortRange.From,PortRange.To,CidrBlock,RuleAction]' \
  --output table
```

## Tear down

```sh
aws cloudformation delete-stack --region "$REGION" --stack-name livekit-egress
aws cloudformation wait stack-delete-complete --region "$REGION" --stack-name livekit-egress
aws cloudformation delete-stack --region "$REGION" --stack-name livekit-core
aws cloudformation wait stack-delete-complete --region "$REGION" --stack-name livekit-core
```

Egress must come down first (it imports values from core). If you try the
other order CFN refuses with "Export ... is in use".

## Security notes

- LK API key/secret are passed as `NoEcho: true` parameters but end up in
  the EC2 launch template's user-data + the core scaler's systemd unit
  (visible to anyone with `ec2:DescribeLaunchTemplateVersions` or root on
  the instance). Fine for dev/test; for production move them to SSM
  Parameter Store or Secrets Manager and fetch at boot.
- The egress ASG's instances accept SSH from 0.0.0.0/0 by default. Narrow
  `EgressSG`'s ingress for anything resembling production.
- core's IAM role is scoped to `SetDesiredCapacity` on a single ARN (the
  egress ASG with the conventional name). No other AWS API access.
- S3 credentials for recording output are passed per-`StartEgress` request
  by Rocket.Chat, not baked into the instance — see the project's
  application code for that wiring.
