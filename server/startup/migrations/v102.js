RocketChat.Migrations.add({
	version: 102,
	up() {
		if (!RocketChat || !RocketChat.models || !RocketChat.models.Settings) {
			return;
		}

		RocketChat.models.Settings.update(
			{ _id: 'LDAP_Connect_Timeout', value: 600000 },
			{ $set: { value: 1000 } }
		);

		RocketChat.models.Settings.update(
			{ _id: 'LDAP_Idle_Timeout', value: 600000 },
			{ $set: { value: 1000 } }
		);

		const LDAP_Domain_Base = RocketChat.models.Settings.findOne({ _id: 'LDAP_Domain_Base' });
		if (LDAP_Domain_Base) {
			RocketChat.models.Settings.update(
				{ _id: 'LDAP_BaseDN' },
				{ $set: { value: LDAP_Domain_Base.value } }
			);
		}
		RocketChat.models.Settings.remove({ _id: 'LDAP_Domain_Base' });

		const LDAP_Domain_Search_User_ID = RocketChat.models.Settings.findOne({ _id: 'LDAP_Domain_Search_User_ID' });
		if (LDAP_Domain_Search_User_ID) {
			RocketChat.models.Settings.update(
				{ _id: 'LDAP_User_Search_Field' },
				{ $set: { value: LDAP_Domain_Search_User_ID.value } }
			);
		}
		RocketChat.models.Settings.remove({ _id: 'LDAP_Domain_Search_User_ID' });

		const LDAP_Use_Custom_Domain_Search = RocketChat.models.Settings.findOne({ _id: 'LDAP_Use_Custom_Domain_Search' });
		const LDAP_Custom_Domain_Search = RocketChat.models.Settings.findOne({ _id: 'LDAP_Custom_Domain_Search' });

		const LDAP_Domain_Search_User = RocketChat.models.Settings.findOne({ _id: 'LDAP_Domain_Search_User' });
		const LDAP_Domain_Search_Password = RocketChat.models.Settings.findOne({ _id: 'LDAP_Domain_Search_Password' });
		const LDAP_Domain_Search_Filter = RocketChat.models.Settings.findOne({ _id: 'LDAP_Domain_Search_Filter' });

		const LDAP_Domain_Search_Object_Class = RocketChat.models.Settings.findOne({ _id: 'LDAP_Domain_Search_Object_Class' });
		const LDAP_Domain_Search_Object_Category = RocketChat.models.Settings.findOne({ _id: 'LDAP_Domain_Search_Object_Category' });

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
			RocketChat.models.Settings.update(
				{ _id: 'LDAP_User_Search_Filter' },
				{ $set: { value: LDAP_Domain_Search_Filter.value } }
			);
		}
		RocketChat.models.Settings.remove({ _id: 'LDAP_Domain_Search_Filter' });

		if (LDAP_Domain_Search_User && LDAP_Domain_Search_User.value) {
			RocketChat.models.Settings.update(
				{ _id: 'LDAP_Authentication_UserDN' },
				{ $set: { value: LDAP_Domain_Search_User.value } }
			);
		}
		RocketChat.models.Settings.remove({ _id: 'LDAP_Domain_Search_User' });


		if (LDAP_Domain_Search_Password && LDAP_Domain_Search_Password.value) {
			RocketChat.models.Settings.update(
				{ _id: 'Password' },
				{ $set: { value: LDAP_Domain_Search_Password.value } }
			);
		}
		RocketChat.models.Settings.remove({ _id: 'LDAP_Domain_Search_Password' });

		if (LDAP_Domain_Search_User && LDAP_Domain_Search_User.value && LDAP_Domain_Search_Password && LDAP_Domain_Search_Password.value) {
			RocketChat.models.Settings.update(
				{ _id: 'Enable' },
				{ $set: { value: true } }
			);
		}

		RocketChat.models.Settings.remove({ _id: 'LDAP_Use_Custom_Domain_Search' });
		RocketChat.models.Settings.remove({ _id: 'LDAP_Custom_Domain_Search' });
		RocketChat.models.Settings.remove({ _id: 'LDAP_Domain_Search_Object_Class' });
		RocketChat.models.Settings.remove({ _id: 'LDAP_Domain_Search_Object_Category' });
		RocketChat.models.Settings.remove({ _id: 'LDAP_Sync_Users' }); //Button

		const LDAP_Sync_User_Data = RocketChat.models.Settings.findOne({ _id: 'LDAP_Sync_User_Data' });
		if (LDAP_Sync_User_Data && LDAP_Sync_User_Data.value) {
			RocketChat.models.Settings.update(
				{ _id: 'LDAP_Background_Sync' },
				{ $set: { value: true } }
			);
		}

		const LDAP_Import_Users = RocketChat.models.Settings.findOne({ _id: 'LDAP_Import_Users' });
		if (LDAP_Import_Users && LDAP_Import_Users.value === false) {
			RocketChat.models.Settings.update(
				{ _id: 'LDAP_Background_Sync_Import_New_Users' },
				{ $set: { value: false } }
			);
		}
		RocketChat.models.Settings.remove({ _id: 'LDAP_Import_Users' });
	}
});
