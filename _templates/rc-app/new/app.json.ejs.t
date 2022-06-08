---
to: apps/<%= name %>/app.json
---

{
	"id": "",
	"version": "0.0.1",
	"requiredApiVersion": "^1.19.0",
	"iconFile": "icon.png",
	"author": {
		"name": "Rocket.Chat Technologies Corp.",
		"homepage": "https://github.com/RocketChat/Rocket.Chat",
		"support": "https://github.com/RocketChat/Rocket.Chat"
	},
	"name": "<%= h.capitalize(name) %>",
	"nameSlug": "<%= name %>",
	"classFile": "src/<%= h.capitalize(name) %>App.ts",
	"description": ""
}
