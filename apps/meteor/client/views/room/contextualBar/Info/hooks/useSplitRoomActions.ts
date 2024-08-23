import type { RoomInfoActionsProps } from '../RoomInfo/RoomInfoActions';

type UseSplitRoomActionsOptions = {
	size?: number;
};

/**
 *
 * @param room
 * @param options
 * @returns If more than two room actions are enabled `menu.regular` will be a non-empty array
 */
export const useSplitRoomActions = (actions: RoomInfoActionsProps['actions'], options?: UseSplitRoomActionsOptions) => {
	const size = options?.size || 2;

	if (actions.items.length <= size) {
		return { buttons: actions };
	}

	const buttons = { items: actions.items.slice(0, size) };
	const regular = actions.items.slice(size);
	const firstDanger = regular.findIndex((item) => item.variant);
	const danger = regular.splice(firstDanger);

	const menu = [{ items: regular }, { items: danger }];

	return { buttons, menu };
};
