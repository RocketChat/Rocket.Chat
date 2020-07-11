export interface IScreenSharingProvider {
	config: any;
	getInfo(): any;
	getJWT(agentDisplayName: string, agentEmail: string): any;
	getURL(sessionId: string): string;
}
