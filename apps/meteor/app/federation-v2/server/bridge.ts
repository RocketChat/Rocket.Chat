import { Bridge, AppServiceRegistration } from 'matrix-appservice-bridge';

import { settings } from '../../settings/server';
import { IMatrixEvent } from './definitions/IMatrixEvent';
import { MatrixEventType } from './definitions/MatrixEventType';
import { addToQueue } from './queue';
import { getRegistrationInfo } from './config';

export const matrixBridge = new Bridge({
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
