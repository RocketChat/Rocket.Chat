import type { LayoutBlock } from '@rocket.chat/ui-kit';

const week = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export const dataVisualizationPie: readonly LayoutBlock[] = [
	{
		type: 'data_visualization',
		title: 'Favorite candy bars',
		chart: {
			type: 'pie',
			segments: [
				{ label: 'Kit Kat', value: 45 },
				{ label: 'Twix', value: 28 },
				{ label: 'Crunch', value: 18 },
				{ label: 'Milky Way', value: 9 },
			],
		},
	},
];

export const dataVisualizationBar: readonly LayoutBlock[] = [
	{
		type: 'data_visualization',
		title: 'Tastiness of pies',
		chart: {
			type: 'bar',
			series: [
				{
					name: 'Pies',
					data: [
						{ label: 'Rhubarb', value: 85 },
						{ label: 'Pumpkin', value: 70 },
						{ label: 'Lemon', value: 72 },
						{ label: 'Blueberry', value: 90 },
						{ label: 'Key Lime', value: 56 },
					],
				},
			],
			axis_config: {
				categories: ['Rhubarb', 'Pumpkin', 'Lemon', 'Blueberry', 'Key Lime'],
				x_label: 'Pies',
				y_label: 'Tastiness (%)',
			},
		},
	},
];

export const dataVisualizationArea: readonly LayoutBlock[] = [
	{
		type: 'data_visualization',
		title: 'Daily active users',
		chart: {
			type: 'area',
			series: [
				{ name: 'Free tier', data: week.map((label, index) => ({ label, value: [12000, 13500, 15200, 14800, 16400][index] })) },
				{ name: 'Paid tier', data: week.map((label, index) => ({ label, value: [4500, 4800, 5100, 5600, 6200][index] })) },
			],
			axis_config: { categories: week, x_label: 'Day', y_label: 'Users' },
		},
	},
];

export const dataVisualizationLine: readonly LayoutBlock[] = [
	{
		type: 'data_visualization',
		title: 'Weekly paper sales',
		chart: {
			type: 'line',
			series: [
				{ name: 'Website', data: week.map((label, index) => ({ label, value: [32000, 35000, 29000, 41000, 45000][index] })) },
				{ name: 'In-store', data: week.map((label, index) => ({ label, value: [28000, 31000, 33000, 30000, 38000][index] })) },
			],
			axis_config: { categories: week, x_label: 'Day', y_label: 'Sales (USD)' },
		},
	},
];
