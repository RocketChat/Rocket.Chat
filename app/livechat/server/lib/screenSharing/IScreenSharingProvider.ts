export interface IScreenSharingProvider {
	config: any;
	getInfo(): any;
	getJWT(agent: any): any;
	getURL(sessionId: string, agent: any): string;
}
