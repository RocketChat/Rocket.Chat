import type { IRoom, RoomType } from '@rocket.chat/core-typings';
import { useLayoutEffect, memo } from 'react';

import { useRoom } from '../contexts/RoomContext';
import type { ToolboxAction, ToolboxActionConfig } from '../lib/Toolbox/index';

const groupsDict = {
	l: 'live',
	v: 'voip',
	d: 'direct',
	p: 'group',
	c: 'channel',
} as const satisfies Record<RoomType, string>;

const getGroup = (room: IRoom) => {
	if (room.teamMain) {
		return 'team';
	}

	if (room.t === 'd' && (room.uids?.length ?? 0) > 2) {
		return 'direct_multiple';
	}

	return groupsDict[room.t];
};

type VirtualActionProps = {
	action: ToolboxAction;
	handleChange: (callback: (list: Map<ToolboxActionConfig['id'], ToolboxAction>) => void) => void;
};

const VirtualAction = ({ action, handleChange }: VirtualActionProps) => {
	const room = useRoom();

	const config = typeof action === 'function' ? action({ room }) : action;

	const group = getGroup(room);

	const visible = !!config && (!config.groups || (groupsDict[room.t] && config.groups.includes(group)));

	useLayoutEffect(() => {
		if (!visible) {
			return;
		}

		handleChange((list) => list.set(config.id, config));

		return () => {
			handleChange((list) => list.delete(config.id));
		};
	}, [config, visible, handleChange]);

	return null;
};

export default memo(VirtualAction);
