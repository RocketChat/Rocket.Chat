import { useLayoutEffect, memo } from 'react';

import { IRoom } from '../../../../definition/IRoom';
import { Store } from '../lib/Toolbox/generator';
import { ToolboxAction } from '../lib/Toolbox/index';

const groupsDict = {
	l: 'live',
	d: 'direct',
	p: 'group',
	c: 'channel',
};

const getGroup = (room: IRoom): string => {
	const group = groupsDict[room.t];
	if (room.teamMain) {
		return 'team';
	}

	if (group === groupsDict.d && room.uids.length > 2) {
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
	handleChange: Function;
}): null => {
	const config = typeof action === 'function' ? action({ room }) : action;

	const group = getGroup(room);

	const visible =
		config && (!config.groups || (groupsDict[room.t] && config.groups.includes(group as any)));

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
