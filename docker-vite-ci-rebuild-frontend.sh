export LOWERCASE_REPOSITORY=rocketchat DOCKER_TAG=local-test
cd apps/meteor && ROOT_URL=http://localhost:3000/ npx vite build && cd ../..
docker compose -f docker-compose-ci-vite.yml build frontend
docker compose -f docker-compose-ci-vite.yml up -d --no-deps --force-recreate frontend