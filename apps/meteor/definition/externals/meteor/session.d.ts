declare module 'meteor/session' {
	namespace Session {
		function _delete(key: string): void;
		export { _delete as delete };
	}
}
