// a custom react hook to get the redirect link for the reported message to the room where the message was reported using the room id

import type { IRoom } from '@rocket.chat/core-typings';

import { useRoomInfoEndpoint } from '../../../../hooks/useRoomInfoEndpoint';

const useConversationRedirectLink = (rid: string): { room: IRoom } | undefined => {
	const { data: room } = useRoomInfoEndpoint(rid);
	return room;
};

export default useConversationRedirectLink;
