import { useMemo } from 'react';

type Action = {
	label: string;
	icon: string;
	action: () => any;
};

type MenuOption = {
	label: { label: string; icon: string };
	action: Function;
};

const mapOptions = ([key, { action, label, icon }]: [string, Action]): [string, MenuOption] => [
	key,
	{
		label: { label, icon }, // TODO fuselage
		action,
	},
];

export const useActionSpread = (
	actions: Action[],
	size = 2,
): { actions: [string, Action][]; menu: { [id: string]: MenuOption } | undefined } =>
	useMemo(() => {
		const entries = Object.entries(actions);

		const options = entries.slice(0, size);
		const menuOptions = entries.slice(size, entries.length).map(mapOptions);
		const menu = menuOptions.length ? Object.fromEntries(menuOptions) : undefined;

		return { actions: options, menu };
	}, [actions, size]);
