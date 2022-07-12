import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';

import { MatrixBridge } from '../../../../../../app/federation-v2/server/infrastructure/matrix/Bridge';
import { MatrixRoomVisibility } from '../../../../../../app/federation-v2/server/infrastructure/matrix/definitions/MatrixRoomVisibility';
import { IFederationBridgeEE } from '../../domain/IFederationBridge';

export class MatrixBridgeEE extends MatrixBridge implements IFederationBridgeEE {
	constructor(
		protected appServiceId: string,
		protected homeServerUrl: string,
		protected homeServerDomain: string,
		protected bridgeUrl: string,
		protected bridgePort: number,
		protected homeServerRegistrationFile: Record<string, any>,
		protected eventHandler: Function,
	) {
		super(appServiceId, homeServerUrl, homeServerDomain, bridgeUrl, bridgePort, homeServerRegistrationFile, eventHandler);
		this.logInfo();
	}

	public async createRoom(externalCreatorId: string, roomType: RoomType, roomName: string, roomTopic?: string): Promise<string> {
		const intent = this.bridgeInstance.getIntent(externalCreatorId);

		const visibility = roomType === 'p' || roomType === 'd' ? MatrixRoomVisibility.PRIVATE : MatrixRoomVisibility.PUBLIC;
		const preset = roomType === 'p' || roomType === 'd' ? 'private_chat' : 'public_chat';

		// Create the matrix room
		const matrixRoom = await intent.createRoom({
			createAsClient: true,
			options: {
				name: roomName,
				topic: roomTopic,
				visibility,
				preset,
				// eslint-disable-next-line @typescript-eslint/camelcase
				creation_content: {
					// eslint-disable-next-line @typescript-eslint/camelcase
					was_internally_programatically_created: true,
				},
			},
		});

		return matrixRoom.room_id;
	}

	public getInstance(): IFederationBridgeEE {
		return this;
	}
}
