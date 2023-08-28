import { darkPalette } from './paletteDark';

export const palette = [
	{
		category: 'Surface',
		description: 'Use as a container on top of the background',
		list: [
			{ name: 'surface-tint', token: '', color: '#262931' },
			{ name: 'surface-hover', token: '', color: '#1B1D22' },
			{ name: 'surface-selected', token: 'N900', color: '#31363F' },
		],
	},
	{
		category: 'Font',
		description: 'These should be applied according to surfaces',
		list: [
			{ name: 'font-titles-labels', token: '', color: '#E4E7EA' },
			{ name: 'font-default', token: '', color: '#9EA2A8' },
		],
	},
	{
		category: 'Status Bullet',
		description: 'Used to show user status',
		list: [
			{ name: 'status-bullet-online', token: '', color: '#1CBF89' },
			{ name: 'status-bullet-away', token: '', color: '#B08C30' },
			{ name: 'status-bullet-busy', token: '', color: '#C75765' },
			{ name: 'status-bullet-disabled', token: '', color: '#CC7F42' },
			{ name: 'status-bullet-offline', token: '', color: '#8B9098' },
			{ name: 'status-bullet-loading', token: '', color: '#8B9098' },
		],
	},
	{
		category: 'Badge',
		description: 'Badge Background',
		list: [
			{ name: 'badge-background-level-0', token: '', color: '#404754' },
			{ name: 'badge-background-level-1', token: '', color: '#484C51' },
			{ name: 'badge-background-level-2', token: '', color: '#2C65BA' },
			{ name: 'badge-background-level-3', token: '', color: '#955828' },
			{ name: 'badge-background-level-4', token: '', color: '#B43C4C' },
		],
	},
	{
		category: 'Stroke',
		description: "Use as component's outline, stroke, dividers",
		list: [
			{ name: 'stroke-light', token: '', color: '#333842' },
			{ name: 'stroke-medium', token: '', color: '#324677' },
		],
	},
	{
		category: 'Button',
		description: 'Secondary Background',
		list: [
			{ name: 'button-background-secondary-default', token: '', color: '#0D0F11' },
			{ name: 'button-background-secondary-hover', token: '', color: '#3A404B' },
			{ name: 'button-background-secondary-press', token: '', color: '#4C5362' },
			{ name: 'button-background-secondary-focus', token: '', color: '#0D0F11' },
			{ name: 'button-background-secondary-keyfocus', token: '', color: '#2F343D' },
			{ name: 'button-background-secondary-disabled', token: '', color: '#2F343D' },
		],
	},
	{
		description: 'Font',
		list: [
			{ name: 'button-font-on-secondary', token: '', color: '#E4E7EA' },
			{ name: 'button-font-on-secondary-disabled', token: '', color: '#6C727A' },
			{ name: 'button-icon-disabled-color', token: '', color: '#6C727A' },
		],
	},
];

export const sidebarPaletteDark = {
	...palette.reduce(
		(rec, group) => ({
			...rec,
			...group.list.reduce(
				(rec, item) => ({
					...rec,
					[item.name]: item.color,
				}),
				{} as Record<string, string>,
			),
		}),
		{ ...darkPalette } as Record<string, string>,
	),
};
