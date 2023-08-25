---
to: packages/<%= name %>/package.json
---

{
	"name": "@rocket.chat/<%= name.toLowerCase() %>",
	"version": "0.0.1",
	"private": true,
	"devDependencies": {
		"@types/jest": "~29.5.3",
		"eslint": "~8.45.0",
		"jest": "~29.6.1",
		"ts-jest": "~29.0.5",
		"typescript": "~5.1.6"
	},
	"scripts": {
		"lint": "eslint --ext .js,.jsx,.ts,.tsx .",
		"lint:fix": "eslint --ext .js,.jsx,.ts,.tsx . --fix",
		"test": "jest",
		"build": "rm -rf dist && tsc -p tsconfig.json",
		"dev": "tsc -p tsconfig.json --watch --preserveWatchOutput"
	},
	"main": "./dist/index.js",
	"typings": "./dist/index.d.ts",
	"files": [
		"/dist"
	]
}
