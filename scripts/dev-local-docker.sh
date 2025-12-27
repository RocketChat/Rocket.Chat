#!/usr/bin/env bash
set -euo pipefail

mongo_container="medsense-mongo"
nats_container="medsense-nats"

if docker ps -a --format '{{.Names}}' | grep -qx "${mongo_container}"; then
	docker start "${mongo_container}" >/dev/null
else
	docker run -d --name "${mongo_container}" -p 27017:27017 \
		mongo:6 mongod --replSet rs0 --oplogSize 128 --bind_ip_all >/dev/null
fi

if docker ps -a --format '{{.Names}}' | grep -qx "${nats_container}"; then
	docker start "${nats_container}" >/dev/null
else
	docker run -d --name "${nats_container}" -p 4222:4222 -p 8222:8222 \
		nats:2.11-alpine -js -m 8222 >/dev/null
fi

if ! docker exec "${mongo_container}" mongosh --eval "rs.status()" >/dev/null 2>&1; then
	docker exec "${mongo_container}" mongosh --eval \
		"rs.initiate({_id:'rs0', members:[{_id:0, host:'127.0.0.1:27017'}]})" >/dev/null
fi

docker exec "${mongo_container}" mongosh rocketchat --eval \
	"const settings = db.getCollection('rocketchat_settings');" >/dev/null
docker exec "${mongo_container}" mongosh rocketchat --eval \
	'const settings = db.getCollection("rocketchat_settings");
	const setValue = (id, value) => settings.updateOne({_id: id}, { $set: { value } }, { upsert: true });
	setValue("Show_Setup_Wizard", "completed");
	setValue("Register_Server", false);
	setValue("Cloud_Workspace_Client_Id", "local");
	setValue("Cloud_Workspace_Client_Secret", "local");' >/dev/null

echo "Mongo and NATS are running."
echo "Setup wizard and cloud registration are bypassed for local dev."
echo "Set env:"
echo "  export MONGO_URL=\"mongodb://127.0.0.1:27017/rocketchat?replicaSet=rs0\""
echo "  export MONGO_OPLOG_URL=\"mongodb://127.0.0.1:27017/local?replicaSet=rs0\""
echo "  export TRANSPORTER=\"monolith+nats://127.0.0.1:4222\""
