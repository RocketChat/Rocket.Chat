declare module 'meteor/session' {
	// eslint-disable-next-line @typescript-eslint/interface-name-prefix
	namespace Session {
		function _delete(key: string): void;
		export { _delete as delete };
	}
}
