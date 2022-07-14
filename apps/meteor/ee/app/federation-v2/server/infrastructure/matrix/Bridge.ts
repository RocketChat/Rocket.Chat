import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';

import { MatrixBridge } from '../../../../../../app/federation-v2/server/infrastructure/matrix/Bridge';
import { MatrixRoomType } from '../../../../../../app/federation-v2/server/infrastructure/matrix/definitions/MatrixRoomType';
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
	}

	public async createRoom(externalCreatorId: string, roomType: RoomType, roomName: string, roomTopic?: string): Promise<string> {
		const intent = this.bridgeInstance.getIntent(externalCreatorId);
		const privateRoomTypes = [RoomType.DIRECT_MESSAGE, RoomType.PRIVATE_GROUP];

		const visibility = privateRoomTypes.includes(roomType) ? MatrixRoomVisibility.PRIVATE : MatrixRoomVisibility.PUBLIC;
		const preset = privateRoomTypes.includes(roomType) ? MatrixRoomType.PRIVATE : MatrixRoomType.PUBLIC;

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
}
