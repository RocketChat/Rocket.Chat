import { Palette } from '@rocket.chat/fuselage';

import type { Period } from '../../../components/dashboards/periods';

export const REPORTS_CHARTS_THEME = {
	labels: {
		text: { fontSize: 12 },
	},
	legends: {
		text: {
			fill: Palette.text['font-annotation'].toString(),
		},
	},
	axis: {
		domain: {
			line: {
				stroke: Palette.text['font-annotation'].toString(),
				strokeWidth: 1,
			},
		},
		ticks: {
			text: {
				fill: Palette.text['font-annotation'].toString(),
				fontFamily:
					'Inter, -apple-system, system-ui, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Meiryo UI", Arial, sans-serif',
				fontSize: 12,
				fontStyle: 'normal',
				letterSpacing: '0.2px',
				lineHeight: '16px',
			},
		},
	},
};

export const COLORS = {
	service2: Palette.statusColor['status-font-on-service-2'].toString(),
	danger: Palette.statusColor['status-font-on-danger'].toString(),
	success: Palette.statusColor['status-font-on-success'].toString(),
	info: Palette.statusColor['status-font-on-info'].toString(),
	warning: Palette.statusColor['status-font-on-warning'].toString(),
	warning2: Palette.statusColor['status-font-on-warning-2'].toString(),
};

export const PERIOD_OPTIONS: Period['key'][] = ['today', 'this week', 'last 15 days', 'this month', 'last 6 months', 'this year'];
