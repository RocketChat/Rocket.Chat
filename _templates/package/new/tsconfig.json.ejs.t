---
to: packages/<%= name %>/tsconfig.json
---
{
	"extends": "@rocket.chat/tsconfig/server.json",
	"compilerOptions": {
		"rootDir": "./src",
		"outDir": "./dist"
	},
	"include": ["./src/**/*"],
}
