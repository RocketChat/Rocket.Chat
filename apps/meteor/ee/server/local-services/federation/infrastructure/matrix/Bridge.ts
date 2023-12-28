import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';

import { MatrixBridge } from '../../../../../../server/services/federation/infrastructure/matrix/Bridge';
import type { AbstractMatrixEvent } from '../../../../../../server/services/federation/infrastructure/matrix/definitions/AbstractMatrixEvent';
import { MATRIX_POWER_LEVELS } from '../../../../../../server/services/federation/infrastructure/matrix/definitions/MatrixPowerLevels';
import { MatrixRoomType } from '../../../../../../server/services/federation/infrastructure/matrix/definitions/MatrixRoomType';
import { MatrixRoomVisibility } from '../../../../../../server/services/federation/infrastructure/matrix/definitions/MatrixRoomVisibility';
import type { RocketChatSettingsAdapter } from '../../../../../../server/services/federation/infrastructure/rocket-chat/adapters/Settings';
import type { IFederationBridgeEE, IFederationPublicRoomsResult, IFederationSearchPublicRoomsParams } from '../../domain/IFederationBridge';

const DEFAULT_TIMEOUT_IN_MS = 10000;

export class MatrixBridgeEE extends MatrixBridge implements IFederationBridgeEE {
	constructor(protected internalSettings: RocketChatSettingsAdapter, protected eventHandler: (event: AbstractMatrixEvent) => void) {
		super(internalSettings, eventHandler);
	}

	private mountPowerLevelRulesWithMinimumPowerLevelForEachAction(): Record<string, any> {
		return {
			ban: MATRIX_POWER_LEVELS.MODERATOR,
			events_default: MATRIX_POWER_LEVELS.USER,
			historical: MATRIX_POWER_LEVELS.ADMIN,
			invite: MATRIX_POWER_LEVELS.MODERATOR,
			kick: MATRIX_POWER_LEVELS.MODERATOR,
			redact: MATRIX_POWER_LEVELS.MODERATOR,
			state_default: MATRIX_POWER_LEVELS.MODERATOR,
			users_default: MATRIX_POWER_LEVELS.USER,
			events: {
				'm.room.avatar': MATRIX_POWER_LEVELS.MODERATOR,
				'm.room.canonical_alias': MATRIX_POWER_LEVELS.MODERATOR,
				'm.room.encryption': MATRIX_POWER_LEVELS.ADMIN,
				'm.room.history_visibility': MATRIX_POWER_LEVELS.ADMIN,
				'm.room.name': MATRIX_POWER_LEVELS.MODERATOR,
				'm.room.power_levels': MATRIX_POWER_LEVELS.MODERATOR,
				'm.room.server_acl': MATRIX_POWER_LEVELS.ADMIN,
				'm.room.tombstone': MATRIX_POWER_LEVELS.ADMIN,
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
				room_alias_name: `${roomName}${Date.now()}`,
				visibility,
				preset: matrixRoomType,
				creation_content: {
					was_internally_programatically_created: true,
				},
				power_level_content_override: this.mountPowerLevelRulesWithMinimumPowerLevelForEachAction(),
				...(roomTopic ? { topic: roomTopic } : {}),
			},
		});
		await intent.setRoomDirectoryVisibility(matrixRoom.room_id, visibility);

		return matrixRoom.room_id;
	}

	public async searchPublicRooms(params: IFederationSearchPublicRoomsParams): Promise<IFederationPublicRoomsResult> {
		const { serverName, limit = 50, roomName, pageToken } = params;
		try {
			return await this.bridgeInstance.getIntent().matrixClient.doRequest(
				'POST',
				`/_matrix/client/r0/publicRooms?server=${serverName}`,
				{},
				{
					filter: { generic_search_term: roomName },
					limit,
					...(pageToken ? { since: pageToken } : {}),
				},
				DEFAULT_TIMEOUT_IN_MS,
			);
		} catch (error) {
			throw new Error('invalid-server-name');
		}
	}
}
