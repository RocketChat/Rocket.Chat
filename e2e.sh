export MONGO_URL='mongodb://localhost:27017/rocketchat?replicaSet=rs0&directConnection=true';

./docker-vite-ci.sh reset
cd apps/meteor
yarn prepare
yarn test:e2e --shard 1/4
cd ../..

./docker-vite-ci.sh reset
cd apps/meteor
yarn prepare
yarn test:e2e --shard 2/4
cd ../..

./docker-vite-ci.sh reset
cd apps/meteor
yarn prepare
yarn test:e2e --shard 3/4
cd ../..

./docker-vite-ci.sh reset
cd apps/meteor
yarn prepare
yarn test:e2e --shard 4/4
cd ../..