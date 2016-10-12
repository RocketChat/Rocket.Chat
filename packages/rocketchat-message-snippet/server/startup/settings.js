Meteor.startup(function() {
	RocketChat.settings.add('Message_AllowSnippeting', true, {
		type: "boolean",
		public: true,
		group: 'Message'
    });
	RocketChat.models.Permissions.upsert('snippet-message', {
		$setOnInsert: {
			roles: ['owner', 'moderator', 'admin']
		}
	});
	RocketChat.settings.addGroup('SnippetCustomFileSystem', function() {
		this.add('Snippet_Storage_Type', 'GridFS', {
			type: 'select',
			values: [{
				key: 'GridFS',
				i18nLabel: 'GridFS'
			}, {
				key: 'FileSystem',
				i18nLabel: 'FileSystem'
			}],
			i18nLabel: 'FileUpload_Storage_Type'
		});

		this.add('Snippet_FileSystemPath', '', {
			type: 'string',
			enableQuery: {
				_id: 'Snippet_Storage_Type',
				value: 'FileSystem'
			},
			i18nLabel: 'FileUpload_FileSystemPath'
		});
	});

});

