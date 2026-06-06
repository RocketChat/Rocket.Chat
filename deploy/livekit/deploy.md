# Deploying LiveKit + Egress to AWS

Single-instance self-hosted LiveKit stack (server + egress + redis + Caddy) on
one EC2, provisioned by `cloudformation.yaml`. Intended for testing — single
AZ, single instance, no HA.

## Prerequisites

- **AWS CLI** configured (`aws sts get-caller-identity` must work)
- **Permissions** in the target account: `cloudformation:*`, `ec2:*`, `iam:CreateRole / AttachRolePolicy / PassRole / CreateInstanceProfile`
- **A domain you control** — Caddy provisions Let's Encrypt certs, which requires a publicly resolvable A record

## 1. Generate LiveKit credentials

```sh
LK_KEY=$(openssl rand -hex 16)
LK_SECRET=$(openssl rand -hex 32)
echo "LIVEKIT_API_KEY=$LK_KEY"
echo "LIVEKIT_API_SECRET=$LK_SECRET"
```

Record these — you'll also paste them into Rocket.Chat's video-conf settings.

## 2. EC2 key pair

```sh
REGION=us-east-1                # match your AWS default
KEYNAME=livekit-test

aws ec2 create-key-pair \
  --region "$REGION" \
  --key-name "$KEYNAME" \
  --key-type ed25519 \
  --query 'KeyMaterial' --output text \
  > ~/.ssh/$KEYNAME.pem
chmod 600 ~/.ssh/$KEYNAME.pem
```

The `chmod 600` is required; SSH refuses keys that are world-readable.

## 3. Choose a VPC

The template creates a new VPC by default, but most corporate AWS accounts
sit at or near the per-region VPC quota (default 5). If the deploy fails with
`The maximum number of VPCs has been reached`, reuse an existing public VPC
instead.

List candidates:

```sh
# VPCs
aws ec2 describe-vpcs --region "$REGION" \
  --query 'Vpcs[].[VpcId,CidrBlock,IsDefault,Tags[?Key==`Name`].Value|[0]]' \
  --output table

# Subnets — pick one with MapPublicIpOnLaunch=true
aws ec2 describe-subnets --region "$REGION" \
  --query 'Subnets[].[VpcId,SubnetId,AvailabilityZone,CidrBlock,MapPublicIpOnLaunch,Tags[?Key==`Name`].Value|[0]]' \
  --output table
```

Confirm the subnet routes `0.0.0.0/0` to an Internet Gateway (not a NAT):

```sh
aws ec2 describe-route-tables --region "$REGION" \
  --filters "Name=association.subnet-id,Values=<subnet-id>" \
  --query 'RouteTables[].Routes[?DestinationCidrBlock==`0.0.0.0/0`].[GatewayId,NatGatewayId]' \
  --output text
# Expected: igw-... in column 1, empty column 2.
```

Note the VPC + subnet IDs.

## 4. Deploy

```sh
aws cloudformation deploy \
  --region "$REGION" \
  --stack-name livekit-dev-test \
  --template-file deploy/livekit/cloudformation.yaml \
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

Drop `ExistingVpcId` / `ExistingPublicSubnetId` if you want the template to
create its own VPC.

Takes ~3-5 min. CloudFormation waits for `cfn-signal` from the in-instance
bootstrap, so `CREATE_COMPLETE` means Docker images are pulled and containers
are running.

## 5. DNS

Get the EIP:

```sh
aws cloudformation describe-stacks \
  --region "$REGION" \
  --stack-name livekit-dev-test \
  --query 'Stacks[0].Outputs' --output table
```

Create an A record:
- `livekit.dev.example.com` → `<PublicIP>`
- TTL 60 while iterating

Wait for propagation:

```sh
dig +short livekit.dev.example.com
# Should return the EIP
```

## 6. Wait for the cert

Caddy attempts cert issuance on startup. **If your DNS A record wasn't in
place at boot, the first attempts will fail** and Caddy enters exponential
backoff (can be minutes-to-hours).

Once DNS resolves, force an immediate retry:

```sh
ssh -i ~/.ssh/$KEYNAME.pem ec2-user@<PublicIP>
sudo docker compose -f /opt/livekit/docker-compose.yml restart caddy
sudo docker compose -f /opt/livekit/docker-compose.yml logs -f caddy
# Watch for: "certificate obtained successfully"
```

Then:

```sh
curl -fsSI https://livekit.dev.example.com/
# 200 OK via Caddy = LK server reachable through TLS
```

## 7. Point Rocket.Chat at it

Workspace settings (Admin → Video Conference → LiveKit, or via REST):

- `VideoConf_LiveKit_URL`: `wss://livekit.dev.example.com`
- `VideoConf_LiveKit_APIKey`: the `$LK_KEY` from step 1
- `VideoConf_LiveKit_APISecret`: the `$LK_SECRET` from step 1

Start a call and check:
- Joining the room (signaling works → port 443 / wss path good)
- Audio + video flowing (media works → UDP 50000-60000 not blocked)
- Captions appearing (worker connected + Gemini path good)
- Recording (Egress reachable; payload must include the S3 destination
  since the template doesn't bake one in)

## Troubleshooting

### Stack stuck in `ROLLBACK_COMPLETE`
That state can't be updated. Delete first, then redeploy:
```sh
aws cloudformation delete-stack --stack-name livekit-dev-test
aws cloudformation wait stack-delete-complete --stack-name livekit-dev-test
```

### "Maximum number of VPCs / IGWs has been reached"
You're at the per-region quota. Either reuse an existing VPC (step 3) or
request a quota increase:
```sh
aws service-quotas request-service-quota-increase \
  --service-code vpc --quota-code L-F678F1CE --desired-value 10
# Takes ~24h. Quota code L-F678F1CE is VPCs/region.
```

### `cloudformation..amazonaws.com` (double dot)
`$REGION` is unset. `export REGION=us-east-1` or pass `--region` literally.

### `tlsv1 alert internal error` from curl
Caddy doesn't have a valid cert yet. Either:
- DNS still propagating — wait a few minutes
- LE failed earlier (NXDOMAIN at the time) and Caddy is in backoff — restart
  Caddy to retry (`docker compose restart caddy`)

### LE rate limit hit (5 failures/hostname/hour)
Switch to LE *staging* (untrusted but unlimited) while debugging. SSH in and
edit `/opt/livekit/Caddyfile` global block:
```
{
  email you@example.com
  acme_ca https://acme-staging-v02.api.letsencrypt.org/directory
}
```
Then `docker compose restart caddy`. Browsers warn; `curl -k` works.

### SSH key "bad permissions"
`chmod 600 ~/.ssh/$KEYNAME.pem` — required.

### SSM `start-session` blocked by KMS
Some corporate accounts enforce KMS-encrypted SSM sessions and your role
can't access the key. Use `aws ssm send-command` instead:
```sh
CMD_ID=$(aws ssm send-command --instance-ids $INSTANCE \
  --document-name AWS-RunShellScript \
  --parameters 'commands=["sudo docker ps"]' \
  --query 'Command.CommandId' --output text)
sleep 3
aws ssm get-command-invocation --command-id $CMD_ID \
  --instance-id $INSTANCE --query 'StandardOutputContent' --output text
```
Or just SSH (step 6).

### Recording fails with `twirp error unknown: no response from servers`
Egress registered as a worker but won't accept room-composite jobs because
of insufficient CPU (egress requires ≥4 vCPU for room-composite by default).
Check `docker compose logs egress` for `not enough cpu for some egress
types`. Fix: redeploy with `InstanceType=t4g.xlarge` (or any 4+ vCPU type),
or lower `cpu_cost.room_composite_cpu_cost` in `/opt/livekit/egress.yaml`
(quality risk on busy rooms).

### Call joins but no media
UDP 50000-60000 inbound is needed for WebRTC media. If you used an existing
VPC, a NACL there may be denying that range. The template's security group
already allows it; NACLs are the next layer up and stay with the VPC. Check:
```sh
aws ec2 describe-network-acls --region "$REGION" \
  --filters "Name=association.subnet-id,Values=<subnet-id>" \
  --query 'NetworkAcls[].Entries[?Egress==`false`].[RuleNumber,Protocol,PortRange.From,PortRange.To,CidrBlock,RuleAction]' \
  --output table
```

## Iterating

For changes to the template (e.g. open a new port), redeploy:
```sh
aws cloudformation deploy ...   # same command; CFN diffs
```

For changes inside the instance only (swap container versions, edit configs),
SSH in:
```sh
sudo vim /opt/livekit/docker-compose.yml         # or livekit.yaml / Caddyfile
sudo docker compose -f /opt/livekit/docker-compose.yml pull
sudo docker compose -f /opt/livekit/docker-compose.yml up -d
```

## Tear down

```sh
aws cloudformation delete-stack --region "$REGION" --stack-name livekit-dev-test
aws cloudformation wait stack-delete-complete --region "$REGION" --stack-name livekit-dev-test

# Optional: remove the key pair
aws ec2 delete-key-pair --region "$REGION" --key-name $KEYNAME
rm ~/.ssh/$KEYNAME.pem
```

## Cost

At rest in `us-east-1` (rough):
- `t4g.large` on-demand: ~$0.067/hr (~$48/mo if 24/7)
- EBS gp3 30 GB: ~$2.40/mo
- EIP attached: free; detached: $0.005/hr
- Data egress: first 100 GB/mo free across all AWS services

If you stop the instance between tests (`aws ec2 stop-instances --instance-ids $INSTANCE`),
hourly compute charge pauses; volume + (detached) EIP charges continue.
