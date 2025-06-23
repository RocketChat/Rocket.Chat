---
to: packages/<%= name %>/package.json
---

{
	"name": "@rocket.chat/<%= name.toLowerCase() %>",
	"version": "0.0.1",
	"private": true,
	"devDependencies": {
		"@rocket.chat/jest-presets": "workspace:~",
		"@rocket.chat/tsconfig": "workspace:*",
		"@types/jest": "~29.5.12",
		"eslint": "~8.45.0",
		"jest": "~30.0.0",
		"typescript": "~5.8.3"
	},
	"scripts": {
		"lint": "eslint --ext .js,.jsx,.ts,.tsx .",
		"lint:fix": "eslint --ext .js,.jsx,.ts,.tsx . --fix",
		"test": "jest",
		"build": "rm -rf dist && tsc -p tsconfig.json",
		"dev": "tsc -p tsconfig.json --watch --preserveWatchOutput",
		"build-preview": "mkdir -p ../../.preview && cp -r ./dist ../../.preview/<%= name.toLowerCase() %>"
	},
	"main": "./dist/index.js",
	"typings": "./dist/index.d.ts",
	"files": [
		"/dist"
	]
}
