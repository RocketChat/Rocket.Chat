import { Bridge as MatrixBridge, AppServiceRegistration } from '@rocket.chat/forked-matrix-appservice-bridge';

import { settings } from '../../settings/server';
import { IMatrixEvent } from './definitions/IMatrixEvent';
import { MatrixEventType } from './definitions/MatrixEventType';
import { addToQueue } from './queue';
import { getRegistrationInfo } from './config';

class Bridge {
	private bridgeInstance: MatrixBridge;

	private isRunning = false;

	public async start(): Promise<void> {
		try {
			await this.stop();
		} finally {
			this.createInstance();
			if (!this.isRunning) {
				await this.bridgeInstance.run(this.getBridgePort());
				this.isRunning = true;
			}
		}
	}

	public async stop(): Promise<void> {
		if (!this.isRunning) {
			return;
		}
		// the http server can take some minutes to shutdown and this promise to be resolved
		await this.bridgeInstance.close();
		this.isRunning = false;
	}

	public getInstance(): MatrixBridge {
		return this.bridgeInstance;
	}

	private createInstance(): void {
		this.bridgeInstance = new MatrixBridge({
			homeserverUrl: settings.get('Federation_Matrix_homeserver_url'),
			domain: settings.get('Federation_Matrix_homeserver_domain'),
			registration: AppServiceRegistration.fromObject(getRegistrationInfo()),
			disableStores: true,
			controller: {
				onAliasQuery: (alias, matrixRoomId): void => {
					console.log('onAliasQuery', alias, matrixRoomId);
				},
				onEvent: async (request /* , context*/): Promise<void> => {
					// Get the event
					const event = request.getData() as unknown as IMatrixEvent<MatrixEventType>;

					addToQueue(event);
				},
				onLog: async (line, isError): Promise<void> => {
					console.log(line, isError);
				},
			},
		});
	}

	private getBridgePort(): number {
		const [, , port] = settings.get<string>('Federation_Matrix_bridge_url').split(':');

		return parseInt(port);
	}
}

export const matrixBridge = new Bridge();
