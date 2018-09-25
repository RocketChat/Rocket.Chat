const settings = ['Accounts_Enrollment_Customized', 'Accounts_UserAddedEmail_Customized', 'Forgot_Password_Customized', 'Verification_Customized', 'Invitation_Customized'];
RocketChat.Migrations.add({
	version: 133,
	up() {

		const accountsSetting = RocketChat.models.Settings.findOne('Accounts_UserAddedEmail');
		delete accountsSetting._id;
		delete accountsSetting.enableQuery;
		delete accountsSetting.i18nDefaultQuery;

		RocketChat.models.Settings.upsert({ _id: 'Accounts_UserAddedEmail_Email' }, accountsSetting);
		RocketChat.models.Settings.removeById('Accounts_UserAddedEmail');

		const invitationSetting = RocketChat.models.Settings.findOne('Invitation_HTML');
		delete invitationSetting._id;
		delete invitationSetting.enableQuery;
		delete invitationSetting.i18nDefaultQuery;
		RocketChat.models.Settings.upsert({ _id: 'Invitation_Email' }, invitationSetting);
		RocketChat.models.Settings.removeById('Invitation_HTML');

		RocketChat.models.Settings.find({ _id: { $in: settings } }).forEach(function(setting) {
			const _id = setting._id.replace('Customized', 'Email');
			const newSetting = RocketChat.models.Settings.findOne({ _id });

			delete newSetting._id;
			delete newSetting.enableQuery;
			delete newSetting.i18nDefaultQuery;
			if (setting.value === false) {
				newSetting.value = newSetting.packageValue;
			}

			RocketChat.models.Settings.upsert({ _id }, newSetting);
		});

		RocketChat.models.Settings.remove({ _id: { $in: settings } }, { multi: true });
	},
});
