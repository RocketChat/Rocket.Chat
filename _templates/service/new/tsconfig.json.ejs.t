---
to: ee/apps/<%= name %>/tsconfig.json
---
{
	"extends": "@rocket.chat/tsconfig/server.json",
	"compilerOptions": {
		"outDir": "./dist"
	},
	"files": ["./src/service.ts"],
	"include": ["../../../apps/meteor/definition/externals/meteor"],
	"exclude": ["./dist"]
}
