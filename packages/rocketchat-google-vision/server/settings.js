Meteor.startup(function() {
	RocketChat.settings.add('GoogleVision_Enable', false, {
		type: 'boolean',
		group: 'FileUpload',
		section: 'Google Vision',
		public: true,
		enableQuery: { _id: 'FileUpload_Storage_Type', value: 'GoogleCloudStorage' }
	});
	RocketChat.settings.add('GoogleVision_ServiceAccount', '', {
		type: 'string',
		group: 'FileUpload',
		section: 'Google Vision',
		multiline: true,
		enableQuery: { _id: 'GoogleVision_Enable', value: true }
	});
	RocketChat.settings.add('GoogleVision_Max_Monthly_Calls', 0, {
		type: 'int',
		group: 'FileUpload',
		section: 'Google Vision',
		enableQuery: { _id: 'GoogleVision_Enable', value: true }
	});
	RocketChat.settings.add('GoogleVision_Current_Month', 0, {
		type: 'int',
		group: 'FileUpload',
		section: 'Google Vision',
		hidden: true
	});
	RocketChat.settings.add('GoogleVision_Current_Month_Calls', 0, {
		type: 'int',
		group: 'FileUpload',
		section: 'Google Vision',
		blocked: true
	});
	RocketChat.settings.add('GoogleVision_Type_Document', false, {
		type: 'boolean',
		group: 'FileUpload',
		section: 'Google Vision',
		enableQuery: { _id: 'GoogleVision_Enable', value: true }
	});
	RocketChat.settings.add('GoogleVision_Type_Faces', false, {
		type: 'boolean',
		group: 'FileUpload',
		section: 'Google Vision',
		enableQuery: { _id: 'GoogleVision_Enable', value: true }
	});
	RocketChat.settings.add('GoogleVision_Type_Landmarks', false, {
		type: 'boolean',
		group: 'FileUpload',
		section: 'Google Vision',
		enableQuery: { _id: 'GoogleVision_Enable', value: true }
	});
	RocketChat.settings.add('GoogleVision_Type_Labels', false, {
		type: 'boolean',
		group: 'FileUpload',
		section: 'Google Vision',
		enableQuery: { _id: 'GoogleVision_Enable', value: true }
	});
	RocketChat.settings.add('GoogleVision_Type_Logos', false, {
		type: 'boolean',
		group: 'FileUpload',
		section: 'Google Vision',
		enableQuery: { _id: 'GoogleVision_Enable', value: true }
	});
	RocketChat.settings.add('GoogleVision_Type_Properties', false, {
		type: 'boolean',
		group: 'FileUpload',
		section: 'Google Vision',
		enableQuery: { _id: 'GoogleVision_Enable', value: true }
	});
	RocketChat.settings.add('GoogleVision_Type_SafeSearch', false, {
		type: 'boolean',
		group: 'FileUpload',
		section: 'Google Vision',
		enableQuery: { _id: 'GoogleVision_Enable', value: true }
	});
	RocketChat.settings.add('GoogleVision_Block_Adult_Images', false, {
		type: 'boolean',
		group: 'FileUpload',
		section: 'Google Vision',
		enableQuery: [{ _id: 'GoogleVision_Enable', value: true }, { _id: 'GoogleVision_Type_SafeSearch', value: true }]
	});
	RocketChat.settings.add('GoogleVision_Type_Similar', false, {
		type: 'boolean',
		group: 'FileUpload',
		section: 'Google Vision',
		enableQuery: { _id: 'GoogleVision_Enable', value: true }
	});
});
