export class CustomOAuth {
	constructor(name: string, options: Record<string, any>);

	getIdentity(accessToken: string, query: Record<string, any>): any;
}
