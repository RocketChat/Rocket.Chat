---
to: ee/apps/<%= name %>/package.json
---
{
	"name": "@rocket.chat/<%= name.toLowerCase() %>",
	"private": true,
	"version": "0.1.0",
	"description": "Rocket.Chat service",
	"scripts": {
		"build": "tsc -p tsconfig.json",
		"ms": "TRANSPORTER=${TRANSPORTER:-TCP} MONGO_URL=${MONGO_URL:-mongodb://localhost:3001/meteor} ts-node --files src/service.ts",
		"test": "echo \"Error: no test specified\" && exit 1",
		"lint": "eslint src",
		"typecheck": "tsc --noEmit --skipLibCheck -p tsconfig.json"
	},
	"keywords": [
		"rocketchat"
	],
	"author": "Rocket.Chat",
	"dependencies": {
		"@rocket.chat/core-services": "workspace:^",
		"@rocket.chat/core-typings": "workspace:^",
		"@rocket.chat/emitter": "next",
		"@rocket.chat/model-typings": "workspace:^",
		"@rocket.chat/models": "workspace:^",
		"@rocket.chat/rest-typings": "workspace:^",
		"@rocket.chat/string-helpers": "next",
		"@types/node": "^14.18.51",
		"ejson": "^2.2.3",
		"eventemitter3": "^4.0.7",
		"mem": "^8.1.1",
		"moleculer": "^0.14.29",
		"mongodb": "^4.12.1",
		"nats": "^2.4.0",
		"pino": "^8.15.0",
		"polka": "^0.5.2"
	},
	"devDependencies": {
		"@rocket.chat/eslint-config": "workspace:^",
		"@types/eslint": "~8.44.0",
		"@types/polka": "^0.5.4",
		"eslint": "~8.45.0",
		"ts-node": "^10.9.1",
		"typescript": "~5.1.6"
	},
	"main": "./dist/ee/apps/<%= name %>/src/service.js",
	"files": [
		"/dist"
	],
	"volta": {
		"node": "14.19.3"
	}
}

