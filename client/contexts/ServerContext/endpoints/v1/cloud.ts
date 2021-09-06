export type CloudEndpoints = {
	'cloud.manualRegister': {
		POST: (params: Record<string, never>, formData: { cloudBlob: string }) => void;
	};
};
