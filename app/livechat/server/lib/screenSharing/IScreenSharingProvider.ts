export interface IScreenSharingProvider {
	config: any;
	getJWT(agent: any): any;
	getURL(sessionId: string, agent: any): string;
}
