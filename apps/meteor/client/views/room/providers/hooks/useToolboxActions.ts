import type { IRoom } from '@rocket.chat/core-typings';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import { useContext, useState, useLayoutEffect } from 'react';

import { ToolboxContext, ToolboxEventHandler } from '../../contexts/ToolboxContext';
import { ToolboxAction } from '../../lib/Toolbox/index';

export const useToolboxActions = (room: IRoom): { listen: ToolboxEventHandler; actions: Array<[string, ToolboxAction]> } => {
	const { listen, actions } = useContext(ToolboxContext);
	const [state, setState] = useSafely(useState<Array<[string, ToolboxAction]>>(Array.from(actions.entries())));

	useLayoutEffect(
		() =>
			listen((actions) => {
				setState(Array.from(actions.entries()));
			}),
		[listen, room, setState],
	);

	return { listen, actions: state };
};
