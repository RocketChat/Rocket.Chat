export type CloudEndpoints = {
	'cloud.manualRegister': {
		POST: (payload: { cloudBlob: string }) => void;
	};
};
