cd apps/meteor &&
ROOT_URL=http://localhost:3000/ npx vite build &&
meteor build --server-only --directory ../../build &&
cd ../.. &&
docker compose -f docker-compose-vite.yml up --build