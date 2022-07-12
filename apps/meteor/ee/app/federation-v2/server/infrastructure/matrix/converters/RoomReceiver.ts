import { MatrixRoomReceiverConverter } from '../../../../../../../app/federation-v2/server/infrastructure/matrix/converters/RoomReceiver';
import {
	FederationRoomChangeJoinRulesDto,
	FederationRoomChangeNameDto,
	FederationRoomChangeTopicDto,
} from '../../../application/input/RoomReceiverDto';
import { IMatrixEventEE } from '../definitions/IMatrixEvent';
import { MatrixEventTypeEE } from '../definitions/MatrixEventType';

export class MatrixRoomReceiverConverterEE extends MatrixRoomReceiverConverter {
	public static toRoomChangeJoinRulesDto(
		externalEvent: IMatrixEventEE<MatrixEventTypeEE.ROOM_JOIN_RULES_CHANGED>,
	): FederationRoomChangeJoinRulesDto {
		return Object.assign(new FederationRoomChangeJoinRulesDto(), {
			...MatrixRoomReceiverConverterEE.getBasicRoomsFields(externalEvent.room_id),
			roomType: MatrixRoomReceiverConverter.convertMatrixJoinRuleToRCRoomType(externalEvent.content?.join_rule),
		});
	}

	public static toRoomChangeNameDto(externalEvent: IMatrixEventEE<MatrixEventTypeEE.ROOM_NAME_CHANGED>): FederationRoomChangeNameDto {
		return Object.assign(new FederationRoomChangeNameDto(), {
			...MatrixRoomReceiverConverterEE.getBasicRoomsFields(externalEvent.room_id),
			normalizedRoomName: MatrixRoomReceiverConverterEE.normalizeRoomNameToRCFormat(externalEvent.content?.name),
		});
	}

	public static toRoomChangeTopicDto(externalEvent: IMatrixEventEE<MatrixEventTypeEE.ROOM_TOPIC_CHANGED>): FederationRoomChangeTopicDto {
		return Object.assign(new FederationRoomChangeTopicDto(), {
			...MatrixRoomReceiverConverterEE.getBasicRoomsFields(externalEvent.room_id),
			roomTopic: externalEvent.content?.topic,
		});
	}

	private static normalizeRoomNameToRCFormat(matrixRoomName = ''): string {
		return matrixRoomName.replace('@', '');
	}
}
