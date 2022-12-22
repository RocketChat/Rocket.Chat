import type { ReactNode } from 'react';
import { useMemo } from 'react';

export type Action = {
	label: ReactNode;
	icon?: string;
	action: () => void;
};

type MenuOption = {
	label: { label: ReactNode; icon?: string };
	action: () => void;
};

const mapOptions = ([key, { action, label, icon }]: [string, Action]): [string, MenuOption] => [
	key,
	{
		label: { label, icon }, // TODO fuselage
		action,
	},
];

export const useActionSpread = (
	actions: {
		[key: string]: Action;
	},
	size = 2,
): { actions: [string, Action][]; menu: { [id: string]: MenuOption } | undefined } =>
	useMemo(() => {
		const entries = Object.entries(actions);

		const options = entries.slice(0, size);
		const menuOptions = entries.slice(size, entries.length).map(mapOptions);
		const menu = menuOptions.length ? Object.fromEntries(menuOptions) : undefined;

		return { actions: options, menu };
	}, [actions, size]);
