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

		/**
		 * Heartbeat options
		 */
		type HeartbeatOptions = {
			/**
			 * interval to send pings, in milliseconds
			 */
			heartbeatInterval: number;
			/**
			 * timeout to close the connection if a reply isn't received, in milliseconds.
			 */
			heartbeatTimeout: number;
			/**
			 * function to call to send a ping on the connection.
			 */
			sendPing: () => void;
			/**
			 * function to call to close the connection
			 */
			onTimeout: () => void;
		};

		class Heartbeat {
			heartbeatInterval: number;

			heartbeatTimeout: number;

			_sendPing: () => void;

			_onTimeout: () => void;

			_seenPacket: boolean;

			_heartbeatIntervalHandle: ReturnType<typeof setTimeout> | null;

			_heartbeatTimeoutHandle: ReturnType<typeof setTimeout> | null;

			constructor(options: HeartbeatOptions);

			stop(): void;

			start(): void;

			_startHeartbeatIntervalTimer(): void;

			_startHeartbeatTimeoutTimer(): void;

			_clearHeartbeatIntervalTimer(): void;

			_clearHeartbeatTimeoutTimer(): void;

			/**
			 *  The heartbeat interval timer is fired when we should send a ping.
			 */
			_heartbeatIntervalFired(): void;

			/**
			 *  The heartbeat timeout timer is fired when we sent a ping, but we timed out waiting for the pong.
			 */
			_heartbeatTimeoutFired(): void;

			messageReceived(): void;
		}
	}
}
