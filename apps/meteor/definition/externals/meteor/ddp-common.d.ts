declare module 'meteor/ddp-common' {
	namespace DDPCommon {
		function stringifyDDP(msg: EJSONable): string;
		function parseDDP(msg: string): EJSONable;
		class MethodInvocation {
			constructor(options: {
				connection: {
					id: string;
					close: () => void;
					clientAddress: string;
					httpHeaders: Record<string, any>;
				};
				isSimulation?: boolean;
				userId?: string;
			});
		}
	}
}
