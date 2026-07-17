import type { Transport } from '@rocket.chat/apps/base-runtime/dist/lib/messenger';

/**
 * Transport that writes messages to the process' standard output.
 *
 * This is the transport used when the runtime is executed as a subprocess by
 * the Apps-Engine framework, and it is specific to platforms that expose a
 * Node-compatible `process.stdout`.
 */
export const stdoutTransport: Transport = {
	async send(message: Uint8Array): Promise<void> {
		await new Promise<void>((resolve, reject) => {
			process.stdout.write(message, (err) => (err ? reject(err) : resolve()));
		});
	},
};
