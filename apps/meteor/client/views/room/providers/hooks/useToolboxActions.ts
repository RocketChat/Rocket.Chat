import type { IRoom } from '@rocket.chat/core-typings';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import { useContext, useState, useLayoutEffect } from 'react';

import type { ToolboxEventHandler } from '../../contexts/ToolboxContext';
import { ToolboxContext } from '../../contexts/ToolboxContext';
import type { ToolboxAction } from '../../lib/Toolbox/index';

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
