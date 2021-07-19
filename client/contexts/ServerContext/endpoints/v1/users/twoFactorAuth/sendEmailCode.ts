export type SendEmailCodeEndpoint = {
	POST: (params: { emailOrUsername: string }) => { success: boolean };
};
