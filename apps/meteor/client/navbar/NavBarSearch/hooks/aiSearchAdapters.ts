import { buildRoomSearchQuery } from '@rocket.chat/ai-search';

export const emptySubscriptionQuery = { _id: '__ai_search_no_room_filter__' };

export const buildUsernameAutocompleteQuery = (
	term = '',
): {
	selector: string;
} => ({ selector: JSON.stringify({ term, conditions: {}, exceptions: [] }) });

export const getRoomLookupQuery = (roomLookupText: string): ReturnType<typeof buildRoomSearchQuery> | typeof emptySubscriptionQuery =>
	roomLookupText ? buildRoomSearchQuery(roomLookupText, '#') : emptySubscriptionQuery;
