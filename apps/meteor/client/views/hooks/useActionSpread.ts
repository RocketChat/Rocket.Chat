import type { Keys as IconName } from '@rocket.chat/icons';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

export type Action = {
<<<<<<< HEAD
	content: ReactNode;
	icon?: ComponentProps<typeof Icon>['name'];
	onClick: () => void;
	type?: string;
=======
	label: ReactNode;
	icon?: IconName;
	action: () => void;
>>>>>>> develop
};

type MenuOption = {
	content: ReactNode;
	icon?: string;
	onClick: () => void;
	type?: string;
};

const mapOptions = ([key, { onClick, content, icon, type }]: [string, Action]): [string, MenuOption] => [
	key,
	{
		content,
		icon,
		onClick,
		type,
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
