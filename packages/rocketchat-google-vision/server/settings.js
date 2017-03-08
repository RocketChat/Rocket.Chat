Meteor.startup(function() {
	RocketChat.settings.add('GoogleVision_Enable', false, { type: 'boolean', group: 'FileUpload', section: 'Google Vision', enableQuery: { _id: 'FileUpload_Storage_Type', value: 'GoogleCloudStorage' } });
	RocketChat.settings.add('GoogleVision_ServiceAccount', '', { type: 'string', group: 'FileUpload', section: 'Google Vision', multiline: true, enableQuery: { _id: 'GoogleVision_Enable', value: true } });
});

