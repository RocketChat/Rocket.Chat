declare module 'meteor/konecty:user-presence' {
	namespace UserPresenceMonitor {
		function processUserSession(userSession: any, event: string): void;
		function onSetUserStatus(callback: any): void;
	}

	namespace UserPresence {
		let awayTime: number | undefined;
		function removeConnectionsByInstanceId(id: string): void;
		function start(): void;
		function stopTimer(): void;
		function setDefaultStatus(userId: string, status: string): void;
	}
}
