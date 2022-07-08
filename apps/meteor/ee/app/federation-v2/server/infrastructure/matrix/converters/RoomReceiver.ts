import { MatrixRoomReceiverConverter } from '../../../../../../../app/federation-v2/server/infrastructure/matrix/converters/RoomReceiver';
import {
	FederationRoomChangeJoinRulesDto,
	FederationRoomChangeNameDto,
	FederationRoomChangeTopicDto,
} from '../../../application/input/RoomReceiverDto';

export class MatrixRoomReceiverConverterEE extends MatrixRoomReceiverConverter {
	public static toRoomChangeJoinRulesDto(
		externalEvent: any,
	): FederationRoomChangeJoinRulesDto {
		return Object.assign(new FederationRoomChangeJoinRulesDto(), {
			...MatrixRoomReceiverConverterEE.getBasicRoomsFields(externalEvent.room_id),
			roomType: MatrixRoomReceiverConverter.convertMatrixJoinRuleToRCRoomType(externalEvent.content?.join_rule),
		});
	}

	public static toRoomChangeNameDto(externalEvent: any): FederationRoomChangeNameDto {
		return Object.assign(new FederationRoomChangeNameDto(), {
			...MatrixRoomReceiverConverterEE.getBasicRoomsFields(externalEvent.room_id),
			normalizedRoomName: MatrixRoomReceiverConverterEE.removeMatrixSpecificChars(externalEvent.content?.name),
		});
	}

	public static toRoomChangeTopicDto(externalEvent: any): FederationRoomChangeTopicDto {
		return Object.assign(new FederationRoomChangeTopicDto(), {
			...MatrixRoomReceiverConverterEE.getBasicRoomsFields(externalEvent.room_id),
			roomTopic: externalEvent.content?.topic,
		});
	}
}
