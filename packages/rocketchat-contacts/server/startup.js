RocketChat.settings.addGroup('Contacts', function() {
	this.add('Contacts_Phone_Custom_Field_Name', '', {
		type: 'string',
		public: true,
	});

	this.add('Contacts_Background_Sync_Interval', 10, {
		type: 'int',
		public: true,
	});
});
