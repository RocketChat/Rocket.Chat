import type { Bridge as MatrixBridge } from '@rocket.chat/forked-matrix-appservice-bridge';

import { settings } from '../../settings/server';
import { Settings } from '../../models/server/raw';
import type { IMatrixEvent } from './definitions/IMatrixEvent';
import type { MatrixEventType } from './definitions/MatrixEventType';
import { addToQueue } from './queue';
import { getRegistrationInfo } from './config';
import { bridgeLogger } from './logger';

class Bridge {
	private bridgeInstance: MatrixBridge;

	private isRunning = false;

	public async start(): Promise<void> {
		try {
			await this.stop();
			await this.createInstance();

			if (!this.isRunning) {
				await this.bridgeInstance.run(this.getBridgePort());
				this.isRunning = true;
			}
		} catch (e) {
			bridgeLogger.error('Failed to initialize the matrix-appservice-bridge.', e);

			bridgeLogger.error('Disabling Matrix Bridge.  Please resolve error and try again');
			Settings.updateValueById('Federation_Matrix_enabled', false);
		}
	}

	public async stop(): Promise<void> {
		if (!this.isRunning) {
			return;
		}
		// the http server can take some minutes to shutdown and this promise to be resolved
		await this.bridgeInstance?.close();
		this.isRunning = false;
	}

	public async getRoomStateByRoomId(userId: string, roomId: string): Promise<Record<string, any>[]> {
		return Array.from(((await this.getInstance().getIntent(userId).roomState(roomId)) as IMatrixEvent<MatrixEventType>[]) || []);
	}

	public getInstance(): MatrixBridge {
		return this.bridgeInstance;
	}

	private async createInstance(): Promise<void> {
		bridgeLogger.info('Performing Dynamic Import of matrix-appservice-bridge');

		// Dynamic import to prevent Rocket.Chat from loading the module until needed and then handle if that fails
		const { Bridge: MatrixBridge, AppServiceRegistration } = await import('@rocket.chat/forked-matrix-appservice-bridge');

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
