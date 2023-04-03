export interface ILogoutRequestValidateCallback {
	(err: string | object | null, data?: Record<string, string | null> | null): Promise<void>;
}

export interface ILogoutResponseValidateCallback {
	(err: string | object | null, inResponseTo?: string | null): Promise<void>;
}

export interface IResponseValidateCallback {
	(err: string | object | null, profile?: Record<string, any> | null, loggedOut?: boolean): void;
}
