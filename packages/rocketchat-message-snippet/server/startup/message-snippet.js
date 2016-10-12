Meteor.startup(function() {
	let storageType = "GridFS";

	if (RocketChat.settings.get("Snippet_Storage_Type")) {
		storageType = RocketChat.settings.get("Snippet_Storage_Type");
	}

	console.log(`Using ${storageType} for snippet storage`.green);

	let RocketChatStore = RocketChatFile[storageType];

	if (RocketChatStore == null || RocketChatStore == undefined) {
		throw new Error(`Invalid RocketChatStore type [${storeType}]`);
	}

	let path = "~/snippets";

	let snippetFSSetting = RocketChat.settings.get('Snippet_FileSystemPath');
	if (snippetFSSetting == null || snippetFSSetting == undefined) {
		if (RocketChat.settings.get('Snippet_FileSystemPath').trim() !== '') {
			path = RocketChat.settings.get('Snippet_FileSystemPath');
		}
	}

	this.RocketChatFileSnippetInstance = new RocketChatStore({
		name: "snippet",
		absolutePath: path
	});
});
