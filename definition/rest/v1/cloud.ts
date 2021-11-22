export type CloudEndpoints = {
	'cloud.manualRegister': {
		POST: (params: { cloudBlob: string }) => void;
	};
	'cloud.createRegistrationIntent': {
		POST: (params: { resend: boolean }) => any;
	};
	'cloud.confirmationPoll': {
		GET: (params: { deviceCode: string; resend?: boolean }) => any;
	};
};
