import '@rocket.chat/ui-contexts';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:addMonitor': (...args: any[]) => any;
		'livechat:removeMonitor': (...args: any[]) => any;
		'livechat:removeTag': (...args: any[]) => any;
		'livechat:removeUnit': (...args: any[]) => any;
		'livechat:saveTag': (...args: any[]) => any;
		'livechat:saveUnit': (...args: any[]) => any;
	}
}
