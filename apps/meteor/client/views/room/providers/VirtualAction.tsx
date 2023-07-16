import type { IRoom, RoomType } from '@rocket.chat/core-typings';
import { useLayoutEffect, memo } from 'react';

import type { Store } from '../lib/Toolbox/generator';
import type { ToolboxAction } from '../lib/Toolbox/index';

const groupsDict = {
	l: 'live',
	v: 'voip',
	d: 'direct',
	p: 'group',
	c: 'channel',
} as const satisfies Record<RoomType, string>;

const getGroup = (room: IRoom) => {
	const group = groupsDict[room.t];
	if (room.teamMain) {
		return 'team';
	}

	if (group === groupsDict.d && (room.uids?.length ?? 0) > 2) {
		return 'direct_multiple';
	}

	return group;
};

const VirtualAction = ({
	handleChange,
	room,
	action,
	id,
}: {
	id: string;
	action: ToolboxAction;
	room: IRoom;
	handleChange: (callback: (list: Store<ToolboxAction>) => void) => void;
}) => {
	const group = getGroup(room);

	const visible = action && (!action.groups || (groupsDict[room.t] && action.groups.includes(group)));

	useLayoutEffect(() => {
		handleChange((list) => {
			visible && action ? list.get(id) !== action && list.set(id, action) : list.delete(id);
		});
		return () => {
			handleChange((list) => list.delete(id));
		};
	}, [action, visible, handleChange, id]);

	return null;
};

export default memo(VirtualAction);
