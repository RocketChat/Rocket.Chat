import { settings } from '../../settings';

settings.addGroup('Contacts', function() {
	this.add('Contacts_Phone_Custom_Field_Name', '', {
		type: 'string',
		public: true,
		i18nDescription: 'Contacts_Phone_Custom_Field_Name_Description',
	});

	this.add('Contacts_Use_Default_Emails', true, {
		type: 'boolean',
		public: true,
		i18nDescription: 'Contacts_Use_Default_Emails_Description',
	});

	this.add('Contacts_Email_Custom_Field_Name', '', {
		type: 'string',
		public: true,
		i18nDescription: 'Contacts_Email_Custom_Field_Name_Description',
	});

	this.add('Contacts_Background_Sync_Interval', 10, {
		type: 'int',
		public: true,
		i18nDescription: 'Contacts_Background_Sync_Interval_Description',
	});
	this.add('Contacts_Dynamic_Link_APIKey', '', {
		type: 'string',
		public: true,
		i18nDescription: 'Contacts_Dynamic_Link_APIKey',
	});
	this.add('Contacts_Dynamic_Link_DomainURIPrefix', '', {
		type: 'string',
		public: true,
		i18nDescription: 'Contacts_Dynamic_Link_DomainURIPrefix',
	});
	this.add('Contacts_Dynamic_Link_AndroidPackageName', '', {
		type: 'string',
		public: true,
		i18nDescription: 'Contacts_Dynamic_Link_AndroidPackageName',
	});
});
