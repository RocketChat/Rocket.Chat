import type { IRoom } from '@rocket.chat/core-typings';
import { RoomType } from '@rocket.chat/core-typings';
import { useLayoutEffect, memo } from 'react';

import { Store } from '../lib/Toolbox/generator';
import { ToolboxAction } from '../lib/Toolbox/index';

const groupsDict: Record<RoomType, string> = {
	l: 'live',
	v: 'voip',
	d: 'direct',
	p: 'group',
	c: 'channel',
};

const getGroup = (room: IRoom): string => {
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
}): null => {
	const config = typeof action === 'function' ? action({ room }) : action;

	const group = getGroup(room);

	const visible = config && (!config.groups || (groupsDict[room.t] && config.groups.includes(group as any)));

	useLayoutEffect(() => {
		handleChange((list: Store<ToolboxAction>) => {
			visible && config ? list.get(id) !== config && list.set(id, config) : list.delete(id);
		});
		return (): void => {
			handleChange((list: Store<ToolboxAction>) => list.delete(id));
		};
	}, [config, visible, handleChange, id]);

	return null;
};

export default memo(VirtualAction);
