import { extractDomainFromMatrixUserId } from './extractDomainFromMatrixUserId';

// The server whose user created the room. Up to room version 11 the room id names it; from
// version 12 on only the create event does, and an invite carries that event in its stripped state.
export const getRoomOrigin = (matrixRoomId: string, strippedState: { type: string; sender: string }[] | undefined): string => {
	const separatorIndex = matrixRoomId.indexOf(':');
	if (separatorIndex !== -1) {
		return matrixRoomId.substring(separatorIndex + 1);
	}

	const createEvent = strippedState?.find((state) => state.type === 'm.room.create');
	if (!createEvent) {
		throw new Error(`Room origin not found for Matrix ID: ${matrixRoomId}`);
	}

	return extractDomainFromMatrixUserId(createEvent.sender);
};
