import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';

import type { IFederationBridgeRegistrationFile } from '../../../../../../app/federation-v2/server/domain/IFederationBridge';
import { MatrixBridge } from '../../../../../../app/federation-v2/server/infrastructure/matrix/Bridge';
import type { AbstractMatrixEvent } from '../../../../../../app/federation-v2/server/infrastructure/matrix/definitions/AbstractMatrixEvent';
import type { MatrixEventRoomNameChanged } from '../../../../../../app/federation-v2/server/infrastructure/matrix/definitions/events/RoomNameChanged';
import type { MatrixEventRoomTopicChanged } from '../../../../../../app/federation-v2/server/infrastructure/matrix/definitions/events/RoomTopicChanged';
import { MatrixEventType } from '../../../../../../app/federation-v2/server/infrastructure/matrix/definitions/MatrixEventType';
import { MatrixRoomType } from '../../../../../../app/federation-v2/server/infrastructure/matrix/definitions/MatrixRoomType';
import { MatrixRoomVisibility } from '../../../../../../app/federation-v2/server/infrastructure/matrix/definitions/MatrixRoomVisibility';
import type { IFederationBridgeEE } from '../../domain/IFederationBridge';
import { MATRIX_POWER_LEVELS } from '../../../../../../app/federation-v2/server/infrastructure/matrix/definitions/MatrixPowerLevels';

export class MatrixBridgeEE extends MatrixBridge implements IFederationBridgeEE {
	constructor(
		protected appServiceId: string,
		protected homeServerUrl: string,
		protected homeServerDomain: string,
		protected bridgeUrl: string,
		protected bridgePort: number,
		protected homeServerRegistrationFile: IFederationBridgeRegistrationFile,
		protected eventHandler: (event: AbstractMatrixEvent) => void,
	) {
		super(appServiceId, homeServerUrl, homeServerDomain, bridgeUrl, bridgePort, homeServerRegistrationFile, eventHandler);
	}

	private mountPowerLevelRulesWithMinimumPowerLevelForEachAction(): Record<string, any> {
		return {
			ban: MATRIX_POWER_LEVELS.MODERATOR,
			events_default: MATRIX_POWER_LEVELS.USER,
			historical: MATRIX_POWER_LEVELS.OWNER,
			invite: MATRIX_POWER_LEVELS.MODERATOR,
			kick: MATRIX_POWER_LEVELS.MODERATOR,
			redact: MATRIX_POWER_LEVELS.MODERATOR,
			state_default: MATRIX_POWER_LEVELS.MODERATOR,
			users_default: MATRIX_POWER_LEVELS.USER,
			events: {
				'm.room.avatar': MATRIX_POWER_LEVELS.MODERATOR,
				'm.room.canonical_alias': MATRIX_POWER_LEVELS.MODERATOR,
				'm.room.encryption': MATRIX_POWER_LEVELS.OWNER,
				'm.room.history_visibility': MATRIX_POWER_LEVELS.OWNER,
				'm.room.name': MATRIX_POWER_LEVELS.MODERATOR,
				'm.room.power_levels': MATRIX_POWER_LEVELS.MODERATOR,
				'm.room.server_acl': MATRIX_POWER_LEVELS.OWNER,
				'm.room.tombstone': MATRIX_POWER_LEVELS.OWNER,
			},
		};
	}

	public async createRoom(externalCreatorId: string, roomType: RoomType, roomName: string, roomTopic?: string): Promise<string> {
		const intent = this.bridgeInstance.getIntent(externalCreatorId);
		const privateRoomTypes = [RoomType.DIRECT_MESSAGE, RoomType.PRIVATE_GROUP];

		const visibility = privateRoomTypes.includes(roomType) ? MatrixRoomVisibility.PRIVATE : MatrixRoomVisibility.PUBLIC;
		const matrixRoomType = privateRoomTypes.includes(roomType) ? MatrixRoomType.PRIVATE : MatrixRoomType.PUBLIC;

		const matrixRoom = await intent.createRoom({
			createAsClient: true,
			options: {
				name: roomName,
				topic: roomTopic,
				visibility,
				preset: matrixRoomType,
				creation_content: {
					was_internally_programatically_created: true,
				},
				power_level_content_override: this.mountPowerLevelRulesWithMinimumPowerLevelForEachAction(),
			},
		});

		return matrixRoom.room_id;
	}

	public async getRoomName(externalRoomId: string, externalUserId: string): Promise<string | undefined> {
		try {
			const roomState = (await this.bridgeInstance.getIntent(externalUserId).roomState(externalRoomId)) as AbstractMatrixEvent[];

			return ((roomState || []).find((event) => event?.type === MatrixEventType.ROOM_NAME_CHANGED) as MatrixEventRoomNameChanged)?.content
				?.name;
		} catch (error) {
			// no-op
		}
	}

	public async getRoomTopic(externalRoomId: string, externalUserId: string): Promise<string | undefined> {
		try {
			const roomState = (await this.bridgeInstance.getIntent(externalUserId).roomState(externalRoomId)) as AbstractMatrixEvent[];

			return ((roomState || []).find((event) => event?.type === MatrixEventType.ROOM_TOPIC_CHANGED) as MatrixEventRoomTopicChanged)?.content
				?.topic;
		} catch (error) {
			// no-op
		}
	}

	public async setRoomName(externalRoomId: string, externalUserId: string, roomName: string): Promise<void> {
		await this.bridgeInstance.getIntent(externalUserId).setRoomName(externalRoomId, roomName);
	}

	public async setRoomTopic(externalRoomId: string, externalUserId: string, roomTopic: string): Promise<void> {
		await this.bridgeInstance.getIntent(externalUserId).setRoomTopic(externalRoomId, roomTopic);
	}
}
