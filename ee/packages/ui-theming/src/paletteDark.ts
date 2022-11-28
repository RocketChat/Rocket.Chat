export const palette = [
	{
		category: 'Stroke',
		description: "Use as component's outline, stroke, dividers",
		list: [
			{ name: 'stroke-extra-light', token: 'N800', color: '#2F343D' },
			{ name: 'stroke-light', token: '', color: '#2A2F37' },
			{ name: 'stroke-medium', token: 'N700', color: '#6C727A' },
			{ name: 'stroke-dark', token: 'N600', color: '#9EA2A8' },
			{ name: 'stroke-extra-dark', token: 'N400', color: '#CBCED1' },
			{ name: 'stroke-extra-light-highlight', token: '', color: '#87CBFC' },
			{ name: 'stroke-highlight', token: '', color: '#3976D1' },
			{ name: 'stroke-extra-light-error', token: '', color: '#F49AA6' },
			{ name: 'stroke-error', token: '', color: '#BB3E4E' },
		],
	},
	{
		category: 'Surface',
		description: 'Use as a container on top of the background',
		list: [
			{ name: 'surface-light', token: 'N900', color: '#1F2329' },
			{ name: 'surface-tint', token: '', color: '#282C34' },
			{ name: 'surface-neutral', token: '', color: '#3A404B' },
			{ name: 'surface-disabled', token: 'N800', color: '#2F343D' },
			{ name: 'surface-hover', token: '', color: '#23282E' },
			{ name: 'surface-selected', token: 'N700', color: '#6C727A' },
			{ name: 'surface-dark', token: 'N400', color: '#E4E7EA' },
		],
	},
	{
		category: 'Font',
		description: 'These should be applied according to surfaces',
		list: [
			{ name: 'font-white', token: 'N800', color: '#2F343D' },
			{ name: 'font-disabled', token: 'N700', color: '#6C727A' },
			{ name: 'font-annotation', token: 'N600', color: '#9EA2A8' },
			{ name: 'font-hint', token: 'N600', color: '#9EA2A8' },
			{ name: 'font-secondary-info', token: '', color: '#6C727A' },
			{ name: 'font-default', token: 'N400', color: '#E4E7EA' },
			{ name: 'font-titles-labels', token: '', color: '#F2F3F5' },
			{ name: 'font-info', token: '', color: '#417CD2' },
			{ name: 'font-danger', token: '', color: '#C44F5E' },
		],
	},
	{
		category: 'Status',
		description: 'Status Background',
		list: [
			{ name: 'status-background-info', token: 'P200', color: '#D1EBFE' },
			{ name: 'status-background-success', token: 'S500', color: '#C0F6E4' },
			{ name: 'status-background-warning', token: 'W200', color: '#FFECAD' },
			{ name: 'status-background-danger', token: 'D200', color: '#FFC1C9' },
			{ name: 'status-background-service-1', token: 'S1-200', color: '#FAD1B0' },
			{ name: 'status-background-service-2', token: 'S2-200', color: '#EDD0F7' },
		],
	},
	{
		description: 'Status Font',
		list: [
			{ name: 'status-font-on-info', token: 'P600', color: '#095AD2' },
			{ name: 'status-font-on-success', token: 'S800', color: '#148660' },
			{ name: 'status-font-on-warning', token: 'W900', color: '#8E6300' },
			{ name: 'status-font-on-danger', token: 'D800', color: '#9B1325' },
			{ name: 'status-font-on-service-1', token: 'S1-800', color: '#974809' },
			{ name: 'status-font-on-service-2 ', token: 'S2-600', color: '#7F1B9F' },
		],
	},
	{
		category: 'Badge',
		description: 'Badge Background',
		list: [
			{ name: 'badge-background-level-1', token: '', color: '#484C51' },
			{ name: 'badge-background-level-2', token: '', color: '#3070CF' },
			{ name: 'badge-background-level-3', token: '', color: '#A9642D' },
			{ name: 'badge-background-level-4', token: '', color: '#BB3E4E' },
		],
	},
	{
		category: 'Button',
		description: 'Primary Background',
		list: [
			{ name: 'button-background-primary-default', token: '', color: '#3976D1' },
			{ name: 'button-background-primary-hover', token: 'P700', color: '#095AD2' },
			{ name: 'button-background-primary-press', token: '', color: '#245399' },
			{ name: 'button-background-primary-focus', token: '', color: '#3976D1' },
			{ name: 'button-background-primary-keyfocus', token: 'P500', color: '#156FF5' },
			{ name: 'button-background-primary-disabled', token: 'P200', color: '#D1EBFE' },
		],
	},
	{
		description: 'Secondary Background',
		list: [
			{ name: 'button-background-secondary-default', token: 'N800', color: '#2F343D' },
			{ name: 'button-background-secondary-hover', token: '', color: '#3A404B' },
			{ name: 'button-background-secondary-press', token: '', color: '#454C59' },
			{ name: 'button-background-secondary-focus', token: 'N800', color: '#2F343D' },
			{ name: 'button-background-secondary-keyfocus', token: 'N800', color: '#2F343D' },
			{ name: 'button-background-secondary-disabled', token: '', color: '#2F343D' },
		],
	},
	{
		description: 'Secondary Danger Background',
		list: [
			{ name: 'button-background-secondary-danger-default', token: 'N800', color: '#2F343D' },
			{ name: 'button-background-secondary-danger-hover', token: '', color: '#3A404B' },
			{ name: 'button-background-secondary-danger-press', token: '', color: '#454C59' },
			{ name: 'button-background-secondary-danger-focus', token: 'N800', color: '#2F343D' },
			{ name: 'button-background-secondary-danger-keyfocus', token: 'N800', color: '#2F343D' },
			{ name: 'button-background-secondary-danger-disabled', token: '', color: '#2F343D' },
		],
	},
	{
		description: 'Danger Background',
		list: [
			{ name: 'button-background-danger-default', token: '', color: '#BB3E4E' },
			{ name: 'button-background-danger-hover', token: '', color: '#95323F' },
			{ name: 'button-background-danger-press', token: '', color: '#822C37' },
			{ name: 'button-background-danger-focus', token: '', color: '#EC0D2A' },
			{ name: 'button-background-danger-keyfocus', token: '', color: '#EC0D2A' },
			{ name: 'button-background-danger-disabled', token: '', color: '#FFC1C9' },
		],
	},
	{
		description: 'Success Background',
		list: [
			{ name: 'button-background-success-default', token: '', color: '#1D7256' },
			{ name: 'button-background-success-hover', token: '', color: '#175943' },
			{ name: 'button-background-success-press', token: '', color: '#0D5940' },
			{ name: 'button-background-success-focus', token: '', color: '#1D7256' },
			{ name: 'button-background-success-keyfocus', token: '', color: '#158D65' },
			{ name: 'button-background-success-disabled', token: '', color: '#C0F6E4' },
		],
	},
	{
		description: 'Font',
		list: [
			{ name: 'button-font-on-primary', token: 'white', color: '#FFFFFF' },
			{ name: 'button-font-on-secondary', token: 'N400', color: '#E4E7EA' },
			{ name: 'button-font-on-secondary-danger', token: 'D900', color: '#BB0B21' },
			{ name: 'button-font-on-danger', token: 'white', color: '#FFFFFF' },
			{ name: 'button-font-on-primary-disabled', token: 'N700', color: '#6C727A' },
			{ name: 'button-font-on-secondary-disabled', token: 'N700', color: '#6C727A' },
			{
				name: 'button-font-on-secondary-danger-disabled',
				token: '',
				color: '#F4F4F4',
			},
			{ name: 'button-font-on-danger-disabled', token: 'white', color: '#FFFFFF' },
			{ name: 'button-font-on-success-disabled', token: 'white', color: '#FFFFFF' },
		],
	},
];

export const darkPalette = {
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
