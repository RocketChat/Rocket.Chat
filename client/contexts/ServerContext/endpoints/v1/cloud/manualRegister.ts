export type ManualRegisterEndpoint = {
	POST: (params: Record<string, never>, formData: { cloudBlob: string }) => void;
};
