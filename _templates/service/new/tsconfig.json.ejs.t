---
to: ee/apps/<%= name %>/tsconfig.json
---
{
	"extends": "../../../tsconfig.base.server.json",
	"compilerOptions": {
		"outDir": "./dist"
	},
	"files": ["./src/service.ts"],
	"include": ["../../../apps/meteor/definition/externals/meteor"],
	"exclude": ["./dist"],
	"ts-node": {
		"transpileOnly": true
	}
}
