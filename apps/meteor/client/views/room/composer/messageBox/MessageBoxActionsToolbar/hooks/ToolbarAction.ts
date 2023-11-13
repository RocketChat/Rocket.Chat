export type ToolbarAction = {
	title?: string;
	disabled?: boolean;
	onClick: (...params: any) => unknown;
	icon: string;
	label: string;
	id: string;
};
