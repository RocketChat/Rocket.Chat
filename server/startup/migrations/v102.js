import { Migrations } from 'meteor/rocketchat:migrations';
import { Settings } from 'meteor/rocketchat:models';

Migrations.add({
	version: 102,
	up() {
		if (!Settings) {
			return;
		}

		Settings.update(
			{ _id: 'LDAP_Connect_Timeout', value: 600000 },
			{ $set: { value: 1000 } }
		);

		Settings.update(
			{ _id: 'LDAP_Idle_Timeout', value: 600000 },
			{ $set: { value: 1000 } }
		);

		const LDAP_Domain_Base = Settings.findOne({ _id: 'LDAP_Domain_Base' });
		if (LDAP_Domain_Base) {
			Settings.update(
				{ _id: 'LDAP_BaseDN' },
				{ $set: { value: LDAP_Domain_Base.value } }
			);
		}
		Settings.remove({ _id: 'LDAP_Domain_Base' });

		const LDAP_Domain_Search_User_ID = Settings.findOne({ _id: 'LDAP_Domain_Search_User_ID' });
		if (LDAP_Domain_Search_User_ID) {
			Settings.update(
				{ _id: 'LDAP_User_Search_Field' },
				{ $set: { value: LDAP_Domain_Search_User_ID.value } }
			);
		}
		Settings.remove({ _id: 'LDAP_Domain_Search_User_ID' });

		const LDAP_Use_Custom_Domain_Search = Settings.findOne({ _id: 'LDAP_Use_Custom_Domain_Search' });
		const LDAP_Custom_Domain_Search = Settings.findOne({ _id: 'LDAP_Custom_Domain_Search' });

		const LDAP_Domain_Search_User = Settings.findOne({ _id: 'LDAP_Domain_Search_User' });
		const LDAP_Domain_Search_Password = Settings.findOne({ _id: 'LDAP_Domain_Search_Password' });
		const LDAP_Domain_Search_Filter = Settings.findOne({ _id: 'LDAP_Domain_Search_Filter' });

		const LDAP_Domain_Search_Object_Class = Settings.findOne({ _id: 'LDAP_Domain_Search_Object_Class' });
		const LDAP_Domain_Search_Object_Category = Settings.findOne({ _id: 'LDAP_Domain_Search_Object_Category' });

		if (LDAP_Use_Custom_Domain_Search) {
			if (LDAP_Use_Custom_Domain_Search.value === true) {
				let Custom_Domain_Search;
				try {
					Custom_Domain_Search = JSON.parse(LDAP_Custom_Domain_Search.value);
				} catch (error) {
					throw new Error('Invalid Custom Domain Search JSON');
				}

				LDAP_Domain_Search_User.value = Custom_Domain_Search.userDN || '';
				LDAP_Domain_Search_Password.value = Custom_Domain_Search.password || '';
				LDAP_Domain_Search_Filter.value = Custom_Domain_Search.filter;
			} else {
				const filter = [];

				if (LDAP_Domain_Search_Object_Category.value !== '') {
					filter.push(`(objectCategory=${ LDAP_Domain_Search_Object_Category.value })`);
				}

				if (LDAP_Domain_Search_Object_Class.value !== '') {
					filter.push(`(objectclass=${ LDAP_Domain_Search_Object_Class.value })`);
				}

				if (LDAP_Domain_Search_Filter.value !== '') {
					filter.push(`(${ LDAP_Domain_Search_Filter.value })`);
				}

				if (filter.length === 1) {
					LDAP_Domain_Search_Filter.value = filter[0];
				} else if (filter.length > 1) {
					LDAP_Domain_Search_Filter.value = `(&${ filter.join('') })`;
				}
			}
		}

		if (LDAP_Domain_Search_Filter && LDAP_Domain_Search_Filter.value) {
			Settings.update(
				{ _id: 'LDAP_User_Search_Filter' },
				{ $set: { value: LDAP_Domain_Search_Filter.value } }
			);
		}
		Settings.remove({ _id: 'LDAP_Domain_Search_Filter' });

		if (LDAP_Domain_Search_User && LDAP_Domain_Search_User.value) {
			Settings.update(
				{ _id: 'LDAP_Authentication_UserDN' },
				{ $set: { value: LDAP_Domain_Search_User.value } }
			);
		}
		Settings.remove({ _id: 'LDAP_Domain_Search_User' });


		if (LDAP_Domain_Search_Password && LDAP_Domain_Search_Password.value) {
			Settings.update(
				{ _id: 'LDAP_Authentication_Password' },
				{ $set: { value: LDAP_Domain_Search_Password.value } }
			);
		}
		Settings.remove({ _id: 'LDAP_Domain_Search_Password' });

		if (LDAP_Domain_Search_User && LDAP_Domain_Search_User.value && LDAP_Domain_Search_Password && LDAP_Domain_Search_Password.value) {
			Settings.update(
				{ _id: 'LDAP_Authentication' },
				{ $set: { value: true } }
			);
		}

		Settings.remove({ _id: 'LDAP_Use_Custom_Domain_Search' });
		Settings.remove({ _id: 'LDAP_Custom_Domain_Search' });
		Settings.remove({ _id: 'LDAP_Domain_Search_Object_Class' });
		Settings.remove({ _id: 'LDAP_Domain_Search_Object_Category' });
		Settings.remove({ _id: 'LDAP_Sync_Users' }); // Button

		const LDAP_Sync_User_Data = Settings.findOne({ _id: 'LDAP_Sync_User_Data' });
		if (LDAP_Sync_User_Data && LDAP_Sync_User_Data.value) {
			Settings.update(
				{ _id: 'LDAP_Background_Sync' },
				{ $set: { value: true } }
			);
		}

		const LDAP_Import_Users = Settings.findOne({ _id: 'LDAP_Import_Users' });
		if (LDAP_Import_Users && LDAP_Import_Users.value === false) {
			Settings.update(
				{ _id: 'LDAP_Background_Sync_Import_New_Users' },
				{ $set: { value: false } }
			);
		}
		Settings.remove({ _id: 'LDAP_Import_Users' });
	},
});
