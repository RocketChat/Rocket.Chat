export interface ILDAPCallback {
	(error?: Error | null, result?: any): void;
}

export interface ILDAPPageData {
	end: boolean;
	next: Function | undefined;
}

export interface ILDAPPageCallback {
	(error?: Error | null, result?: any, page?: ILDAPPageData): void;
}
