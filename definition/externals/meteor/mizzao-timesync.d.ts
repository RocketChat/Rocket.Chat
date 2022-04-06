declare module 'meteor/mizzao:timesync' {
	namespace TimeSync {
		let loggingEnabled: boolean;

		function serverOffset(): number;
	}
}
