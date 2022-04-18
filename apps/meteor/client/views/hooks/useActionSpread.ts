import { Icon } from '@rocket.chat/fuselage';
import { useMemo, ComponentProps } from 'react';

export type Action = {
	label: string;
	icon: ComponentProps<typeof Icon>['name'];
	action: () => void;
	checkOption?: boolean;
	isChecked?: boolean;
};

export type MenuOption = {
	label: { label: string; icon: ComponentProps<typeof Icon>['name']; checkOption?: boolean; isChecked?: boolean };
	action: Function;
};

// TODO fuselage
const mapOptions = ([key, { action, label, icon, checkOption, isChecked }]: [string, Action]): [string, MenuOption] => [
	key,
	{
		label: { label, icon, checkOption, isChecked },
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
