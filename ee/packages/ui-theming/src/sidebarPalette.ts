export const palette = [
	{
		category: 'Font',
		description: 'These should be applied according to surfaces',
		list: [
			{ name: 'font-titles-labels', token: '', color: '#E4E7EA' },
			{ name: 'font-default', token: '', color: '#9EA2A8' },
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
