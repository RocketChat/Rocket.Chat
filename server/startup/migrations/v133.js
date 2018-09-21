const settings = ['Accounts_Enrollment_Customized', 'Accounts_UserAddedEmail_Customized', 'Forgot_Password_Customized', 'Verification_Customized', 'Invitation_Customized'];
RocketChat.Migrations.add({
	version: 133,
	up() {

		const accountsSetting = RocketChat.models.Settings.findOne('Accounts_UserAddedEmail');
		delete accountsSetting._id;
		RocketChat.models.Settings.upsert({ _id: 'Accounts_UserAddedEmail_Email' }, accountsSetting);
		RocketChat.models.Settings.removeById('Accounts_UserAddedEmail');

		const invitationSetting = RocketChat.models.Settings.findOne('Invitation_HTML');
		delete invitationSetting._id;
		RocketChat.models.Settings.upsert({ _id: 'Invitation_Email' }, invitationSetting);
		RocketChat.models.Settings.removeById('Invitation_HTML');

		RocketChat.models.Settings.find({ _id: { $in: settings }, value: false }).forEach(function(setting) {
			const id = setting._id.replace('Customized', 'Email');
			RocketChat.models.Settings.updateValueById(id, setting.packageValue);
		});

		RocketChat.models.Settings.remove({ _id: { $in: settings } }, { multi: true });
	},
});
