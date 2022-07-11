import { MatrixRoomReceiverConverter } from '../../../../../../../app/federation-v2/server/infrastructure/matrix/converters/RoomReceiver';
import {
	FederationRoomChangeJoinRulesDto,
	FederationRoomChangeNameDto,
	FederationRoomChangeTopicDto,
} from '../../../application/input/RoomReceiverDto';
import { MatrixEventRoomJoinRulesChanged } from '../definitions/events/RoomJoinRulesChanged';
import { MatrixEventRoomNameChanged } from '../definitions/events/RoomNameChanged';
import { MatrixEventRoomTopicChanged } from '../definitions/events/RoomTopicChanged';

export class MatrixRoomReceiverConverterEE extends MatrixRoomReceiverConverter {
	public static toRoomChangeJoinRulesDto(externalEvent: MatrixEventRoomJoinRulesChanged): FederationRoomChangeJoinRulesDto {
		return new FederationRoomChangeJoinRulesDto({
			...MatrixRoomReceiverConverterEE.getBasicRoomsFields(externalEvent.room_id),
			roomType: MatrixRoomReceiverConverter.convertMatrixJoinRuleToRCRoomType(externalEvent.content?.join_rule),
		});
	}

	public static toRoomChangeNameDto(externalEvent: MatrixEventRoomNameChanged): FederationRoomChangeNameDto {
		return new FederationRoomChangeNameDto({
			...MatrixRoomReceiverConverterEE.getBasicRoomsFields(externalEvent.room_id),
			normalizedRoomName: MatrixRoomReceiverConverterEE.removeMatrixSpecificChars(externalEvent.content?.name),
		});
	}

	public static toRoomChangeTopicDto(externalEvent: MatrixEventRoomTopicChanged): FederationRoomChangeTopicDto {
		return new FederationRoomChangeTopicDto({
			...MatrixRoomReceiverConverterEE.getBasicRoomsFields(externalEvent.room_id),
			roomTopic: externalEvent.content?.topic,
		});
	}
}
