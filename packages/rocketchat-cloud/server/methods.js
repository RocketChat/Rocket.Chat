import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Random } from 'meteor/random';
import { HTTP } from 'meteor/http';

Meteor.methods({
	'cloud:retrieveRegistrationInfo'() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'cloud:retrieveRegistrationInfo' });
		}

		if (!RocketChat.authz.hasPermission(Meteor.userId(), 'manage-cloud')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'cloud:retrieveRegistrationInfo' });
		}

		const info = {
			canConnect: RocketChat.settings.get('Register_Server'),
			token: '',
			email: '',
		};

		const firstUser = RocketChat.models.Users.getOldest({ emails: 1 });
		info.email = firstUser && firstUser.emails[0].address;

		if (RocketChat.models.Settings.findOne('Organization_Email')) {
			info.email = RocketChat.settings.get('Organization_Email');
		}

		return info;
	},
	'cloud:updateEmail'(email) {
		check(email, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'cloud:updateEmail' });
		}

		if (!RocketChat.authz.hasPermission(Meteor.userId(), 'manage-cloud')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'cloud:updateEmail' });
		}

		RocketChat.models.Settings.updateValueById('Organization_Email', email);
	},
	'cloud:connectServer'(token) {
		check(token, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'cloud:connectServer' });
		}

		if (!RocketChat.authz.hasPermission(Meteor.userId(), 'manage-cloud')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'cloud:connectServer' });
		}

		const redirectUrl = `${ RocketChat.settings.get('Site_Url') }/api/cloud/redirect`.replace(/\/\/+/g, '/');

		const regInfo = {
			email: RocketChat.settings.get('Organization_Email'),
			client_name: RocketChat.settings.get('Site_Name'),
			redirectUris: [redirectUrl],
		};

		console.log(regInfo);

		const cloudUrl = RocketChat.settings.get('Cloud_Url');
		const result = HTTP.post(`${ cloudUrl }/api/oauth/clients`, {
			headers: {
				Authorization: `Bearer ${ token }`,
			},
			data: regInfo,
		});

		const { data } = result;

		const state = Random.id();
		RocketChat.models.Settings.updateValueById('Cloud_Workspace_Id', data.workspaceId);
		RocketChat.models.Settings.updateValueById('Cloud_Workspace_Name', data.client_name);
		RocketChat.models.Settings.updateValueById('Cloud_Workspace_Client_Id', data.client_id);
		RocketChat.models.Settings.updateValueById('Cloud_Workspace_Client_Secret', data.client_secret);
		RocketChat.models.Settings.updateValueById('Cloud_Workspace_Client_Secret_Expires_At', data.client_secret_expires_at);
		RocketChat.models.Settings.updateValueById('Cloud_Workspace_Registration_Client_Uri', data.registration_client_uri);
		RocketChat.models.Settings.updateValueById('Cloud_Workspace_Registration_State', state);

		const url = `${ cloudUrl }/authorize?response_type=code&client_id=${ data.client_id }&redirect_uri=${ redirectUrl }&scope=offline+workspace&state=${ state }`;

		console.log('User is being sent to:', url);

		return {
			url,
		};
	},
	'cloud:continueConnecting'(code, state) {
		check(code, String);
		check(state, String);

		// We do not expect any user to call this, they're simply redirected to a url which calls this
		if (Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'cloud:continueConnecting' });
		}

		if (RocketChat.settings.get('Cloud_Workspace_Registration_State') !== this.queryParams.state) {
			throw new Meteor.Error('error-invalid-state', 'Invalid state provided', { method: 'cloud:continueConnecting' });
		}

		const redirectUrl = `${ RocketChat.settings.get('Site_Url') }/api/cloud/redirect`.replace(/\/\/+/g, '/');
		const cloudUrl = RocketChat.settings.get('Cloud_Url');
		const clientId = RocketChat.settings.get('Cloud_Workspace_Client_Id');
		const clientSecret = RocketChat.settings.get('Cloud_Workspace_Client_Secret');

		const result = HTTP.post(`${ cloudUrl }/api/oauth/token`, {
			data: {},
			query: {
				client_id: clientId,
				client_secret: clientSecret,
				grant_type: 'authorization_code',
				code,
				redirect_uri: redirectUrl,
			},
		});

		// const result2 = {
		// 	access_token: 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJVc2VySUQiOiI1OGMwNDkwODEwNzU3ZDBjODhmN2I2YjkiLCJSb2xlIjoiYWRtaW4iLCJTY29wZSI6Im9mZmxpbmUrd29ya3NwYWNlIiwiZXhwIjoxNTQ1Mjg3Mzg3LCJqdGkiOiJhNjRiNDVhNS03MzFlLTQyNDAtODVmOC05M2I0ODUxZDQzOTUiLCJpYXQiOjE1NDUyODM3ODcsImlzcyI6IlJvY2tldC5DaGF0In0.rB277xSSHideU8z82MnpX7cqMo2tGwr25Aj25VcQGUpQfH2rPdcSnjRLm-yhL7YZTHzKsY6jXTaoLwoQalRJDQ',
		// 	expires_in: 14400,
		// 	scope: 'offline+workspace',
		// 	refresh_token: 'mysupersecretrefreshtoken',
		// 	token_type: 'Bearer',
		// };

		console.log(result);
	},
});
