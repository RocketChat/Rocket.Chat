export const palette = [
	{
		category: 'Background',
		list: [
			{ name: 'background-light', token: 'white', color: '#FFFFFF', isDark: false, rgb: 'rgb(255, 255, 255)' },
			{ name: 'background-tint', token: 'N100', color: '#F7F8FA', isDark: false, rgb: 'rgb(247, 248, 250)' },
		],
	},
	{
		category: 'Stroke',
		description: "Use as component's outline, stroke, dividers",
		list: [
			{ name: 'stroke-extra-light', token: 'N200', color: '#F2F3F5', isDark: false, rgb: 'rgb(242, 243, 245)' },
			{ name: 'stroke-light', token: 'N500', color: '#CBCED1', isDark: false, rgb: 'rgb(203, 206, 209)' },
			{ name: 'stroke-medium', token: 'N600', color: '#9EA2A8', isDark: false, rgb: 'rgb(158, 162, 168)' },
			{ name: 'stroke-dark', token: 'N700', color: '#6C727A', isDark: true, rgb: 'rgb(108, 114, 122)' },
			{ name: 'stroke-extra-dark', token: 'N800', color: '#2F343D', isDark: true, rgb: 'rgb(47, 52, 61)' },
			{ name: 'stroke-extra-light-highlight', token: 'P200', color: '#D1EBFE', isDark: false, rgb: 'rgb(209, 235, 254)' },
			{ name: 'stroke-highlight', token: 'P500', color: '#156FF5', isDark: true, rgb: 'rgb(21, 111, 245)' },
			{ name: 'stroke-extra-light-error', token: 'D200', color: '#FFC1C9', isDark: false, rgb: 'rgb(255, 193, 201)' },
			{ name: 'stroke-error', token: 'D500', color: '#EC0D2A', isDark: true, rgb: 'rgb(236, 13, 42)' },
		],
	},
	{
		category: 'Surface',
		description: 'Use as a container on top of the background',
		list: [
			{ name: 'surface-light', token: 'white', color: '#FFFFFF', isDark: false, rgb: 'rgb(255, 255, 255)' },
			{ name: 'surface-tint', token: 'N100', color: '#F7F8FA', isDark: false, rgb: 'rgb(247, 248, 250)' },
			{ name: 'surface-neutral', token: 'N400', color: '#E4E7EA', isDark: false, rgb: 'rgb(228, 231, 234)' },
			{ name: 'surface-hover', token: 'N400', color: '#E4E7EA', isDark: false, rgb: 'rgb(228, 231, 234)' },
			{ name: 'surface-disabled', token: 'N100', color: '#F7F8FA', isDark: false, rgb: 'rgb(247, 248, 250)' },
		],
	},
	{
		category: 'Font',
		description: 'These should be applied according to surfaces',
		list: [
			{ name: 'white', token: 'white', color: '#FFFFFF', isDark: false, rgb: 'rgb(255, 255, 255)' },
			{ name: 'default', token: 'N800', color: '#2F343D', isDark: true, rgb: 'rgb(47, 52, 61)' },
			{ name: 'titles-labels', token: 'N900', color: '#1F2329', isDark: true, rgb: 'rgb(31, 35, 41)' },
			{ name: 'disabled', token: 'N500', color: '#CBCED1', isDark: false, rgb: 'rgb(203, 206, 209)' },
			{ name: 'annotation', token: 'N600', color: '#9EA2A8', isDark: false, rgb: 'rgb(158, 162, 168)' },
			{ name: 'hint', token: 'N700', color: '#6C727A', isDark: true, rgb: 'rgb(108, 114, 122)' },
			{ name: 'secondary-info', token: 'N700', color: '#6C727A', isDark: true, rgb: 'rgb(108, 114, 122)' },
			{ name: 'info', token: 'P600', color: '#095AD2', isDark: true, rgb: 'rgb(9, 90, 210)' },
			{ name: 'danger', token: 'D600', color: '#D40C26', isDark: true, rgb: 'rgb(212, 12, 38)' },
		],
	},
	{
		category: 'Status',
		description: 'Status Background',
		list: [
			{ name: 'status-background-info', token: 'P200', color: '#D1EBFE', isDark: false, rgb: 'rgb(209, 235, 254)' },
			{ name: 'status-background-success', token: 'S500', color: '#C0F6E4', isDark: false, rgb: 'rgb(192, 246, 228)' },
			{ name: 'status-background-warning', token: 'W200', color: '#FFECAD', isDark: false, rgb: 'rgb(255, 236, 173)' },
			{ name: 'status-background-danger', token: 'D200', color: '#FFC1C9', isDark: false, rgb: 'rgb(255, 193, 201)' },
			{ name: 'status-background-service-1', token: 'S1-200', color: '#FAD1B0', isDark: false, rgb: 'rgb(250, 209, 176)' },
			{ name: 'status-background-service-2', token: 'S2-200', color: '#EDD0F7', isDark: false, rgb: 'rgb(237, 208, 247)' },
		],
	},
	{
		description: 'Status Font',
		list: [
			{ name: 'status-font-on-info', token: 'P600', color: '#095AD2', isDark: true, rgb: 'rgb(9, 90, 210)' },
			{ name: 'status-font-on-success', token: 'S800', color: '#148660', isDark: true, rgb: 'rgb(20, 134, 96)' },
			{ name: 'status-font-on-warning', token: 'W900', color: '#8E6300', isDark: true, rgb: 'rgb(142, 99, 0)' },
			{ name: 'status-font-on-danger', token: 'D800', color: '#9B1325', isDark: true, rgb: 'rgb(155, 19, 37)' },
			{ name: 'status-font-on-service-1', token: 'S1-800', color: '#974809', isDark: true, rgb: 'rgb(151, 72, 9)' },
			{ name: 'status-font-on-service-2', token: 'S2-600', color: '#7F1B9F', isDark: true, rgb: 'rgb(127, 27, 159)' },
		],
	},
	{
		category: 'Button',
		description: 'Primary Background',
		list: [
			{ name: 'button-primary-default', token: 'P500', color: '#156FF5', isDark: true, rgb: 'rgb(21, 111, 245)' },
			{ name: 'button-primary-hover', token: 'P600', color: '#095AD2', isDark: true, rgb: 'rgb(9, 90, 210)' },
			{ name: 'button-primary-focus', token: 'P500', color: '#156FF5', isDark: true, rgb: 'rgb(21, 111, 245)' },
			{ name: 'button-primary-keyfocus', token: 'P500', color: '#156FF5', isDark: true, rgb: 'rgb(21, 111, 245)' },
			{ name: 'button-primary-press', token: 'P700', color: '#095AD2', isDark: true, rgb: 'rgb(16, 82, 158)' },
			{ name: 'button-primary-disabled', token: 'P200', color: '#D1EBFE', isDark: false, rgb: 'rgb(209, 235, 254)' },
		],
	},
	{
		description: 'Secondary Background',
		list: [
			{ name: 'button-secondary-default', token: 'N400', color: '#E4E7EA', isDark: false, rgb: 'rgb(228, 231, 234)' },
			{ name: 'button-secondary-hover', token: 'N500', color: '#CBCED1', isDark: false, rgb: 'rgb(203, 206, 209)' },
			{ name: 'button-secondary-focus', token: 'N400', color: '#E4E7EA', isDark: false, rgb: 'rgb(228, 231, 234)' },
			{ name: 'button-secondary-keyfocus', token: 'N400', color: '#E4E7EA', isDark: false, rgb: 'rgb(228, 231, 234)' },
			{ name: 'button-secondary-press', token: 'N600', color: '#CBCED1', isDark: false, rgb: 'rgb(158, 162, 168)' },
			{ name: 'button-secondary-disabled', token: 'N300', color: '#EEEFF1', isDark: false, rgb: 'rgb(238, 239, 241)' },
		],
	},
	{
		description: 'Secondary Danger Background',
		list: [
			{ name: 'button-secondary-danger-default', token: 'N400', color: '#E4E7EA', isDark: false, rgb: 'rgb(228, 231, 234)' },
			{ name: 'button-secondary-danger-hover', token: 'N500', color: '#CBCED1', isDark: false, rgb: 'rgb(203, 206, 209)' },
			{ name: 'button-secondary-danger-focus', token: 'N400', color: '#E4E7EA', isDark: false, rgb: 'rgb(228, 231, 234)' },
			{ name: 'button-secondary-danger-keyfocus', token: 'N400', color: '#E4E7EA', isDark: false, rgb: 'rgb(228, 231, 234)' },
			{ name: 'button-secondary-danger-press', token: 'N600', color: '#CBCED1', isDark: false, rgb: 'rgb(158, 162, 168)' },
			{ name: 'button-secondary-danger-disabled', token: 'N300', color: '#EEEFF1', isDark: false, rgb: 'rgb(238, 239, 241)' },
		],
	},
	{
		description: 'Danger Background',
		list: [
			{ name: 'button-danger-default', token: 'D500', color: '#EC0D2A', isDark: false, rgb: 'rgb(236, 13, 42)' },
			{ name: 'button-danger-hover', token: 'D600', color: '#D40C26', isDark: false, rgb: 'rgb(212, 12, 38)' },
			{ name: 'button-danger-focus', token: 'D500', color: '#EC0D2A', isDark: false, rgb: 'rgb(236, 13, 42)' },
			{ name: 'button-danger-keyfocus', token: 'D500', color: '#EC0D2A', isDark: false, rgb: 'rgb(236, 13, 42)' },
			{ name: 'button-danger-press', token: 'D700', color: '#BB0B21', isDark: false, rgb: 'rgb(187, 11, 33)' },
			{ name: 'button-danger-disabled', token: 'D200', color: '#FFC1C9', isDark: false, rgb: 'rgb(255, 193, 201)' },
		],
	},
	{
		description: 'Font',
		list: [
			{ name: 'button-font-on-primary', token: 'white', color: '#FFFFFF', isDark: false, rgb: 'rgb(255, 255, 255)' },
			{ name: 'button-font-on-secondary', token: 'N900', color: '#1F2329', isDark: true, rgb: 'rgb(31, 35, 41)' },
			{ name: 'button-font-on-secondary-danger', token: 'D900', color: '#BB0B21', isDark: true, rgb: 'rgb(187, 11, 33)' },
			{ name: 'button-font-on-danger', token: 'white', color: '#FFFFFF', isDark: false, rgb: 'rgb(255, 255, 255)' },
			{ name: 'button-font-on-primary-disabled', token: 'white', color: '#FFFFFF', isDark: false, rgb: 'rgb(255, 255, 255)' },
			{ name: 'button-font-on-secondary-disabled', token: 'N600', color: '#9EA2A8', isDark: false, rgb: 'rgb(158, 162, 168)' },
			{ name: 'button-font-on-secondary-danger-disabled', token: 'D300', color: '#F98F9D', isDark: false, rgb: 'rgb(249, 143, 157)' },
			{ name: 'button-font-on-danger-disabled', token: 'white', color: '#FFFFFF', isDark: false, rgb: 'rgb(255, 255, 255)' },
		],
	},
];

export const defaultValues = {
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
