export type CloudEndpoints = {
	'cloud.manualRegister': {
		POST: (params: { cloudBlob: string }) => void;
	};
	'cloud.createRegistrationIntent': {
		POST: () => any;
	};
};
