import { IMatrixEvent } from './definitions/IMatrixEvent';
import { MatrixEventType } from './definitions/MatrixEventType';
import { handleRoomMembership, handleCreateRoom, handleSendMessage, setRoomJoinRules, setRoomName, setRoomTopic } from './events';

export const eventHandler = async (event: IMatrixEvent<MatrixEventType>): Promise<void> => {
	console.log(`Processing ${event.type}...`, JSON.stringify(event, null, 2));

	switch (event.type) {
		case MatrixEventType.CREATE_ROOM: {
			await handleCreateRoom(event as IMatrixEvent<MatrixEventType.CREATE_ROOM>);

			break;
		}
		case MatrixEventType.ROOM_MEMBERSHIP: {
			await handleRoomMembership(event as IMatrixEvent<MatrixEventType.ROOM_MEMBERSHIP>);

			break;
		}
		case MatrixEventType.SET_ROOM_JOIN_RULES: {
			await setRoomJoinRules(event as IMatrixEvent<MatrixEventType.SET_ROOM_JOIN_RULES>);

			break;
		}
		case MatrixEventType.SET_ROOM_NAME: {
			await setRoomName(event as IMatrixEvent<MatrixEventType.SET_ROOM_NAME>);

			break;
		}
		case MatrixEventType.SET_ROOM_TOPIC: {
			await setRoomTopic(event as IMatrixEvent<MatrixEventType.SET_ROOM_TOPIC>);

			break;
		}
		case MatrixEventType.SEND_MESSAGE: {
			await handleSendMessage(event as IMatrixEvent<MatrixEventType.SEND_MESSAGE>);

			break;
		}
		// case MatrixEventType.SET_ROOM_POWER_LEVELS:
		// case MatrixEventType.SET_ROOM_CANONICAL_ALIAS:
		// case MatrixEventType.SET_ROOM_HISTORY_VISIBILITY:
		// case MatrixEventType.SET_ROOM_GUEST_ACCESS: {
		// 	console.log(`Ignoring ${event.type}`);
		//
		// 	break;
		// }
		default:
			console.log(`Could not find handler for ${event.type}`, event);
	}
};
