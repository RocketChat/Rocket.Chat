export const palette = [
	{
		category: 'Stroke',
		description: "Use as component's outline, stroke, dividers",
		list: [
			{ name: 'stroke-extra-light', token: 'N250', color: '#EBECEF' },
			{ name: 'stroke-light', token: 'N500', color: '#CBCED1' },
			{ name: 'stroke-medium', token: 'N600', color: '#9EA2A8' },
			{ name: 'stroke-dark', token: 'N700', color: '#6C727A' },
			{ name: 'stroke-extra-dark', token: 'N800', color: '#2F343D' },
			{ name: 'stroke-extra-light-highlight', token: 'P200', color: '#D1EBFE' },
			{ name: 'stroke-highlight', token: 'P500', color: '#156FF5' },
			{ name: 'stroke-extra-light-error', token: 'D200', color: '#FFC1C9' },
			{ name: 'stroke-error', token: 'D500', color: '#EC0D2A' },
		],
	},
	{
		category: 'Surface',
		description: 'Use as a container on top of the background',
		list: [
			{ name: 'surface-light', token: 'white', color: '#FFFFFF' },
			{ name: 'surface-tint', token: 'N100', color: '#F7F8FA' },
			{ name: 'surface-neutral', token: 'N400', color: '#E4E7EA' },
			{ name: 'surface-disabled', token: 'N100', color: '#F7F8FA' },
			{ name: 'surface-hover', token: 'N200', color: '#F2F3F5' },
			{ name: 'surface-selected', token: 'N400', color: '#E4E7EA' },
			{ name: 'surface-dark', token: 'N900', color: '#1F2329' },
		],
	},
	{
		category: 'Font',
		description: 'These should be applied according to surfaces',
		list: [
			{ name: 'font-white', token: 'white', color: '#FFFFFF' },
			{ name: 'font-disabled', token: 'N100', color: '#F7F8FA' },
			{ name: 'font-annotation', token: 'N600', color: '#9EA2A8' },
			{ name: 'font-hint', token: 'N700', color: '#6C727A' },
			{ name: 'font-secondary-info', token: 'N700', color: '#6C727A' },
			{ name: 'font-default', token: 'N800', color: '#2F343D' },
			{ name: 'font-titles-labels', token: 'N900', color: '#1F2329' },
			{ name: 'font-info', token: 'P600', color: '#095AD2' },
			{ name: 'font-danger', token: 'D600', color: '#D40C26' },
			{ name: 'font-pure-black', token: '', color: '#2F343D' },
			{ name: 'font-pure-white', token: '', color: '#FFFFFF' },
		],
	},
	{
		category: 'Status',
		description: 'Status Background',
		list: [
			{ name: 'status-background-info', token: 'P200', color: '#D1EBFE' },
			{ name: 'status-background-success', token: 'S500', color: '#C0F6E4' },
			{ name: 'status-background-danger', token: 'D200', color: '#FFC1C9' },
			{ name: 'status-background-warning', token: 'W200', color: '#FFECAD' },
			{ name: 'status-background-warning-2', token: 'W100', color: '#FFF6D6' },
			{ name: 'status-background-service-1', token: 'S1-200', color: '#FAD1B0' },
			{ name: 'status-background-service-2', token: 'S2-200', color: '#EDD0F7' },
			{ name: 'status-background-service-3', token: 'S2-700', color: '#5F1477' },
		],
	},
	{
		description: 'Status Font',
		list: [
			{ name: 'status-font-on-info', token: 'P600', color: '#095AD2' },
			{ name: 'status-font-on-success', token: 'S800', color: '#148660' },
			{ name: 'status-font-on-danger', token: 'D800', color: '#9B1325' },
			{ name: 'status-font-on-warning', token: 'W900', color: '#8E6300' },
			{ name: 'status-font-on-warning-2', token: 'N800', color: '#2F343D' },
			{ name: 'status-font-on-service-1', token: 'S1-800', color: '#974809' },
			{ name: 'status-font-on-service-2 ', token: 'S2-600', color: '#7F1B9F' },
			{ name: 'status-font-on-service-3 ', token: 'white', color: '#FFFFFF' },
		],
	},
	{
		category: 'Badge',
		description: 'Badge Background',
		list: [
			{ name: 'badge-background-level-1', token: 'N700', color: '#6C727A' },
			{ name: 'badge-background-level-2', token: '', color: '#1D74F5' },
			{ name: 'badge-background-level-3', token: '', color: '#F38C39' },
			{ name: 'badge-background-level-4', token: '', color: '#F5455C' },
		],
	},
	{
		category: 'Elevation',
		description: 'Elevation border and shadow levels',
		list: [
			{ name: 'shadow-elevation-border', token: '', color: '#EBECEF' },
			{ name: 'shadow-elevation-1', token: '', color: 'rgba(47, 52, 61, 0.1)' },
			{ name: 'shadow-elevation-2x', token: '', color: 'rgba(47, 52, 61, 0.08)' },
			{ name: 'shadow-elevation-2y', token: '', color: 'rgba(47, 52, 61, 0.12)' },
		],
	},
	{
		category: 'Button',
		description: 'Primary Background',
		list: [
			{ name: 'button-background-primary-default', token: 'P500', color: '#156FF5' },
			{ name: 'button-background-primary-hover', token: 'P600', color: '#095AD2' },
			{ name: 'button-background-primary-press', token: 'P700', color: '#095AD2' },
			{ name: 'button-background-primary-focus', token: 'P500', color: '#156FF5' },
			{ name: 'button-background-primary-keyfocus', token: 'P500', color: '#156FF5' },
			{ name: 'button-background-primary-disabled', token: 'P200', color: '#D1EBFE' },
		],
	},
	{
		description: 'Secondary Background',
		list: [
			{ name: 'button-background-secondary-default', token: 'N400', color: '#E4E7EA' },
			{ name: 'button-background-secondary-hover', token: 'N500', color: '#CBCED1' },
			{ name: 'button-background-secondary-press', token: 'N600', color: '#CBCED1' },
			{ name: 'button-background-secondary-focus', token: 'N400', color: '#E4E7EA' },
			{ name: 'button-background-secondary-keyfocus', token: 'N400', color: '#E4E7EA' },
			{ name: 'button-background-secondary-disabled', token: 'N300', color: '#EEEFF1' },
		],
	},
	{
		description: 'Secondary Danger Background',
		list: [
			{ name: 'button-background-secondary-danger-default', token: 'N400', color: '#E4E7EA' },
			{ name: 'button-background-secondary-danger-hover', token: 'N500', color: '#CBCED1' },
			{ name: 'button-background-secondary-danger-press', token: 'N600', color: '#CBCED1' },
			{ name: 'button-background-secondary-danger-focus', token: 'N400', color: '#E4E7EA' },
			{ name: 'button-background-secondary-danger-keyfocus', token: 'N400', color: '#E4E7EA' },
			{ name: 'button-background-secondary-danger-disabled', token: 'N300', color: '#EEEFF1' },
		],
	},
	{
		description: 'Danger Background',
		list: [
			{ name: 'button-background-danger-default', token: 'D500', color: '#EC0D2A' },
			{ name: 'button-background-danger-hover', token: 'D600', color: '#D40C26' },
			{ name: 'button-background-danger-press', token: 'D700', color: '#BB0B21' },
			{ name: 'button-background-danger-focus', token: 'D500', color: '#EC0D2A' },
			{ name: 'button-background-danger-keyfocus', token: 'D500', color: '#EC0D2A' },
			{ name: 'button-background-danger-disabled', token: 'D200', color: '#FFC1C9' },
		],
	},
	{
		description: 'Success Background',
		list: [
			{ name: 'button-background-success-default', token: '', color: '#158D65' },
			{ name: 'button-background-success-hover', token: 'S900', color: '#106D4F' },
			{ name: 'button-background-success-press', token: 'S1000', color: '#0D5940' },
			{ name: 'button-background-success-focus', token: '', color: '#158D65' },
			{ name: 'button-background-success-keyfocus', token: '', color: '#158D65' },
			{ name: 'button-background-success-disabled', token: 'S200', color: '#C0F6E4' },
		],
	},
	{
		description: 'Font',
		list: [
			{ name: 'button-font-on-primary', token: 'white', color: '#FFFFFF' },
			{ name: 'button-font-on-secondary', token: 'N900', color: '#1F2329' },
			{ name: 'button-font-on-secondary-danger', token: 'D900', color: '#BB0B21' },
			{ name: 'button-font-on-danger', token: 'white', color: '#FFFFFF' },
			{ name: 'button-font-on-primary-disabled', token: 'white', color: '#FFFFFF' },
			{ name: 'button-font-on-secondary-disabled', token: 'N600', color: '#9EA2A8' },
			{
				name: 'button-font-on-secondary-danger-disabled',
				token: 'D300',
				color: '#F98F9D',
			},
			{ name: 'button-font-on-danger-disabled', token: 'white', color: '#FFFFFF' },
		],
	},
];

export const defaultPalette = {
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
