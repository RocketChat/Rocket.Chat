import type { Keys as IconName } from '@rocket.chat/icons';

export type ToolbarAction = {
	title?: string;
	disabled?: boolean;
	onClick: (...params: any) => unknown;
	icon: IconName;
	label: string;
	id: string;
};
