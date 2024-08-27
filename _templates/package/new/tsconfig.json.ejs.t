---
to: packages/<%= name %>/tsconfig.json
---
{
	"extends": "../../tsconfig.base.server.json",
	"compilerOptions": {
		"rootDir": "./src",
		"outDir": "./dist"
	},
	"include": ["./src/**/*"],
}
