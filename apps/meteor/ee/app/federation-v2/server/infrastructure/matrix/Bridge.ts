import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';

import type { IFederationBridgeRegistrationFile } from '../../../../../../app/federation-v2/server/domain/IFederationBridge';
import { MatrixBridge } from '../../../../../../app/federation-v2/server/infrastructure/matrix/Bridge';
import { formatExternalUserIdToInternalUsernameFormat } from '../../../../../../app/federation-v2/server/infrastructure/matrix/converters/RoomReceiver';
import type { AbstractMatrixEvent } from '../../../../../../app/federation-v2/server/infrastructure/matrix/definitions/AbstractMatrixEvent';
import type { MatrixEventRoomNameChanged } from '../../../../../../app/federation-v2/server/infrastructure/matrix/definitions/events/RoomNameChanged';
import type { MatrixEventRoomTopicChanged } from '../../../../../../app/federation-v2/server/infrastructure/matrix/definitions/events/RoomTopicChanged';
import { MatrixEventType } from '../../../../../../app/federation-v2/server/infrastructure/matrix/definitions/MatrixEventType';
import { MatrixRoomType } from '../../../../../../app/federation-v2/server/infrastructure/matrix/definitions/MatrixRoomType';
import { MatrixRoomVisibility } from '../../../../../../app/federation-v2/server/infrastructure/matrix/definitions/MatrixRoomVisibility';
import type { IFederationBridgeEE, IFederationPublicRoomsResult, IFederationSearchPublicRoomsParams } from '../../domain/IFederationBridge';

const DEFAULT_TIMEOUT_IN_MS = 10000;

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

	public async createRoom(externalCreatorId: string, roomType: RoomType, roomName: string, roomTopic?: string): Promise<string> {
		const intent = this.bridgeInstance.getIntent(externalCreatorId);
		const privateRoomTypes = [RoomType.DIRECT_MESSAGE, RoomType.PRIVATE_GROUP];

		const visibility = privateRoomTypes.includes(roomType) ? MatrixRoomVisibility.PRIVATE : MatrixRoomVisibility.PUBLIC;
		const matrixRoomType = privateRoomTypes.includes(roomType) ? MatrixRoomType.PRIVATE : MatrixRoomType.PUBLIC;

		const matrixRoom = await intent.createRoom({
			createAsClient: true,
			options: {
				name: roomName,
				visibility,
				preset: matrixRoomType,
				room_alias_name: roomName,
				creation_content: {
					was_internally_programatically_created: true,
				},
				...(roomTopic ? { topic: roomTopic } : {}),
			},
		});
		await intent.setRoomDirectoryVisibility(matrixRoom.room_id, visibility);

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

	public async searchPublicRooms(params: IFederationSearchPublicRoomsParams): Promise<IFederationPublicRoomsResult> {
		const { serverName, limit = 100, roomName, pageToken } = params;
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
			throw new Error('Invalid server name');
		}
	}

	public async getRoomData(
		externalUserId: string,
		externalRoomId: string,
	): Promise<{ creator: { id: string; username: string }; name: string } | undefined> {
		const includeEvents = ['join'];
		const excludeEvents = ['leave', 'ban'];
		const members = await this.bridgeInstance
			.getIntent(externalUserId)
			.matrixClient.getRoomMembers(externalRoomId, undefined, includeEvents as any[], excludeEvents as any[]);

		const oldestFirst = members.sort((a, b) => a.timestamp - b.timestamp).shift();
		if (!oldestFirst) {
			return;
		}

		const roomName = await this.getRoomName(externalRoomId, externalUserId);
		if (!roomName) {
			return;
		}

		return {
			creator: {
				id: oldestFirst.sender,
				username: formatExternalUserIdToInternalUsernameFormat(oldestFirst.sender),
			},
			name: roomName,
		};
	}
}
