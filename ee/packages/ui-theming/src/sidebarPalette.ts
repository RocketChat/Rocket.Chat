export const palette = [
	{
		category: 'Surface',
		description: 'Use as a container on top of the background',
		list: [
			{ name: 'surface-default', token: '', color: '#2f343d' },
			{ name: 'surface-hover', token: '', color: '#1f2329' },
			{ name: 'surface-selected', token: '', color: 'rgba(108,114,122, 0.3)' },
		],
	},
	{
		category: 'Font',
		description: 'These should be applied according to surfaces',
		list: [
			{ name: 'font-primary', token: 'N200', color: '#FFF' },
			{ name: 'font-secondary', token: 'N600', color: '#9EA2A8' },
		],
	},
	{
		category: 'User Presence',
		description: 'Used to show user status',
		list: [
			{ name: 'user-presence-online', token: '', color: '#1CBF89' },
			{ name: 'user-presence-busy', token: '', color: '#C14454' },
			{ name: 'user-presence-away', token: '', color: '#AC892F' },
			{ name: 'user-presence-offline', token: '', color: '#6C727A' },
		],
	},
	{
		category: 'Badge',
		description: 'Badge Background',
		list: [
			{ name: 'badge-background-level-1', token: '', color: '#6C727A' },
			{ name: 'badge-background-level-2', token: '', color: '#3976D1' },
			{ name: 'badge-background-level-3', token: '', color: '#C0830C' },
			{ name: 'badge-background-level-4', token: '', color: '#BB3E4E' },
		],
	},
	{
		category: 'Stroke',
		description: "Use as component's outline, stroke, dividers",
		list: [
			{ name: 'stroke-default', token: '', color: '#cbced1' },
			{ name: 'stroke-focus', token: '', color: '#EBECEF' },
			{ name: 'stroke-extra-light', token: '', color: '#1F2329' },
		],
	},
	{
		category: 'Button',
		description: 'Secondary Background',
		list: [
			{ name: 'button-background-secondary-default', token: '', color: '#2f343d' },
			{ name: 'button-background-secondary-hover', token: '', color: '#1f2329' },
			{ name: 'button-background-secondary-press', token: '', color: '#414852' },
			{ name: 'button-background-secondary-focus', token: '', color: '#6c727a' },
			{ name: 'button-background-secondary-keyfocus', token: '', color: '#6c727a' },
			{ name: 'button-background-secondary-disabled', token: '', color: '#1f2329' },
		],
	},
	{
		description: 'Font',
		list: [
			{ name: 'button-font-on-secondary', token: 'N400', color: '#9EA2A8' },
			{ name: 'button-font-on-secondary-disabled', token: '', color: '#6C727A' },
			{ name: 'button-icon-disabled-color', token: '', color: '#6C727A' },
		],
	},
];

export const defaultSidebarPalette = {
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
		{} as Record<string, string>,
	),
};
