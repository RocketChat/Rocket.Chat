type CloudRegistrationIntentData = {
	device_code: string;
	user_code: string;
	verification_url: string;
	interval: number;
	expires_in: number;
};

export type CloudEndpoints = {
	'cloud.manualRegister': {
		POST: (params: { cloudBlob: string }) => void;
	};
	'cloud.createRegistrationIntent': {
		POST: (params: { resend: boolean; email: string }) => any;
	};
	'cloud.confirmationPoll': {
		GET: (params: { deviceCode: string; resend?: boolean }) => any;
	};
};
