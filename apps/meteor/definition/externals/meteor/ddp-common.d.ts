declare module 'meteor/ddp-common' {
	namespace DDPCommon {
		function stringifyDDP(msg: EJSONable): string;
		function parseDDP(msg: string): EJSONable;
	}
}
