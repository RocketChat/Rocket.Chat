export class AppSettingBridge {
	constructor(orch) {
		this.orch = orch;
		this.allowedGroups = [];
		this.disallowedSettings = [
			'Accounts_RegistrationForm_SecretURL', 'CROWD_APP_USERNAME', 'CROWD_APP_PASSWORD', 'Direct_Reply_Username',
			'Direct_Reply_Password', 'SMTP_Username', 'SMTP_Password', 'FileUpload_S3_AWSAccessKeyId', 'FileUpload_S3_AWSSecretAccessKey',
			'FileUpload_S3_BucketURL', 'FileUpload_GoogleStorage_Bucket', 'FileUpload_GoogleStorage_AccessId',
			'FileUpload_GoogleStorage_Secret', 'GoogleVision_ServiceAccount', 'Allow_Invalid_SelfSigned_Certs', 'GoogleTagManager_id',
			'Bugsnag_api_key', 'LDAP_CA_Cert', 'LDAP_Reject_Unauthorized', 'LDAP_Domain_Search_User', 'LDAP_Domain_Search_Password',
			'Livechat_secret_token', 'Livechat_Knowledge_Apiai_Key', 'AutoTranslate_GoogleAPIKey', 'MapView_GMapsAPIKey',
			'Meta_fb_app_id', 'Meta_google-site-verification', 'Meta_msvalidate01', 'Accounts_OAuth_Dolphin_secret',
			'Accounts_OAuth_Drupal_secret', 'Accounts_OAuth_Facebook_secret', 'Accounts_OAuth_Github_secret', 'API_GitHub_Enterprise_URL',
			'Accounts_OAuth_GitHub_Enterprise_secret', 'API_Gitlab_URL', 'Accounts_OAuth_Gitlab_secret', 'Accounts_OAuth_Google_secret',
			'Accounts_OAuth_Linkedin_secret', 'Accounts_OAuth_Meteor_secret', 'Accounts_OAuth_Twitter_secret', 'API_Wordpress_URL',
			'Accounts_OAuth_Wordpress_secret', 'Push_apn_passphrase', 'Push_apn_key', 'Push_apn_cert', 'Push_apn_dev_passphrase',
			'Push_apn_dev_key', 'Push_apn_dev_cert', 'Push_gcm_api_key', 'Push_gcm_project_number', 'SAML_Custom_Default_cert',
			'SAML_Custom_Default_private_key', 'SlackBridge_APIToken', 'Smarsh_Email', 'SMS_Twilio_Account_SID', 'SMS_Twilio_authToken'
		];
	}

	getAll(appId) {
		console.log(`The App ${ appId } is getting all the settings.`);

		return RocketChat.models.Settings.find({ _id: { $nin: this.disallowedSettings } }).fetch().map((s) => {
			this.orch.getConverters().get('settings').convertToApp(s);
		});
	}

	getOneById(id, appId) {
		console.log(`The App ${ appId } is getting the setting by id ${ id }.`);

		if (!this.isReadableById(id, appId)) {
			throw new Error(`The setting "${ id }" is not readable.`);
		}

		return this.orch.getConverters().get('settings').convertById(id);
	}

	hideGroup(name, appId) {
		console.log(`The App ${ appId } is hidding the group ${ name }.`);

		throw new Error('Method not implemented.');
	}

	hideSetting(id, appId) {
		console.log(`The App ${ appId } is hidding the setting ${ id }.`);

		if (!this.isReadableById(id, appId)) {
			throw new Error(`The setting "${ id }" is not readable.`);
		}

		throw new Error('Method not implemented.');
	}

	isReadableById(id, appId) {
		console.log(`The App ${ appId } is checking if they can read the setting ${ id }.`);

		return !this.disallowedSettings.includes(id);
	}

	updateOne(setting, appId) {
		console.log(`The App ${ appId } is updating the setting ${ setting.id } .`);

		if (!this.isReadableById(setting.id, appId)) {
			throw new Error(`The setting "${ setting.id }" is not readable.`);
		}

		throw new Error('Method not implemented.');
	}
}
