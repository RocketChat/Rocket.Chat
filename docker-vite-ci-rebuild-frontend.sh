export LOWERCASE_REPOSITORY=rocketchat
export DOCKER_TAG=local-test

cd apps/meteor
ROOT_URL=http://localhost:3000 VITE_TEST_MODE=true npx vite build --outDir /tmp/build/dist
cd ../..
docker compose -f docker-compose-ci-vite.yml build frontend
docker compose -f docker-compose-ci-vite.yml up -d --no-deps --force-recreate frontend