export type CloudRegistrationStatus = {
	connectToCloud: boolean;
	email: string;
	token: string;
	uniqueId: string;
	workspaceId: string;
	workspaceRegistered: boolean;
};

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
	successful: boolean;
	payload: {
		workspaceId: string;
		client_name: string;
		client_id: string;
		client_secret: string;
		redirect_uris: Array<string>;
		publicKey: string;
		client_secret_expires_at: number;
		registration_client_uri: string;
		licenseData: {
			version: number;
			address: string;
			license: string;
			updatedAt: string;
			modules: string;
			expireAt: string;
		};
	};
};

export type CloudConfirmationPollData = CloudConfirmationPollDataPending | CloudConfirmationPollDataSuccess;
