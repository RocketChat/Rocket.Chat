export interface IScreenSharingProvider {
	config: any;
	getInfo(): any;
	getJWT(): any;
	getURL(sessionId: string): string;
}
