export type CloudRegistrationIntentData = {
	device_code: string;
	user_code: string;
	verification_url: string;
	interval: number;
	expires_in: number;
};

type CloudConfirmationPollDataPending = {
	status: 'authorization_pending';
};

type CloudConfirmationPollDataSuccess = {
	successful: true;
	payload: {
		workspaceId: '61e83fdd18c66900010b1600';
		client_name: 'Rocket.Chat';
		client_id: '61e83fe818c66900010b1601';
		client_secret: 'LfTsTcC103S-sdeHocmq';
		redirect_uris: ['https://http://localhost:3000//admin/cloud/oauth-callback'];
		publicKey: '-----BEGIN RSA PUBLIC KEY-----\nMIIBCgKCAQEAm+5RXbkUx6l1DsP7uHONSvbWvkJriaB9NgGLo+EVveyjWSOVaUNV\n6fX4VlUgiobwqrx+sIEU+JWUi1PnNdwjZb4blukBKcC8jcxG6/kPb6zrJpC0YhUJ\nSi9YnSE6vozsu7O6wcfrp3Ib3Js+r7jBz+ewCpThPmSl6PwVt5+OLPfiRnR8WqFG\nIDCCvUNtVgafFPq50jVHNHwAM97LuFzqqxIvb4Pas1w2FKSEfa02LgKp894EwGgf\nLUSw0W3v7v1oC5Zg44EcdXLn9aQB3T/YC4TMwrx6yidunaW7yxii60JoKaskpXfm\nFxeYmn+eru3gP3UrIjZdhcAsWFY6h6dD2wIDAQAB\n-----END RSA PUBLIC KEY-----\n';
		client_secret_expires_at: 0;
		registration_client_uri: 'https://my.staging.cloud.rocket.chat/api/v2/workspaces/61e83fdd18c66900010b1600';
		licenseData: {
			version: 0;
			address: '';
			license: '';
			updatedAt: '0001-01-01T00:00:00Z';
			modules: '';
			expireAt: '0001-01-01T00:00:00Z';
		};
	};
};

export type CloudConfirmationPollData = CloudConfirmationPollDataPending | CloudConfirmationPollDataSuccess;
