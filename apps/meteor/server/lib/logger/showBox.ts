import { createColors } from 'colorette';

import { lrpad } from '../../../lib/utils/stringUtils';

// force enable colors on dev env
const colors = createColors({
	useColor: process.env.NODE_ENV !== 'production',
});

type LogColors = 'white' | 'blue' | 'green' | 'magenta' | 'red';

function showBox(title: string, message: string, color?: LogColors): void {
	const msgLines = message.split('\n');

	const len = Math.max.apply(
		null,
		msgLines.map((line) => line.length),
	);

	const topLine = `+--${'-'.repeat(len)}--+`;
	const separator = `|  ${' '.repeat(len)}  |`;

	const lines = [];

	lines.push(topLine);
	if (title) {
		lines.push(`|  ${lrpad(title, len)}  |`);
		lines.push(topLine);
	}
	lines.push(separator);

	[...lines, ...msgLines.map((line) => `|  ${line.padEnd(len)}  |`), separator, topLine].forEach((line) =>
		console.log(color ? colors[color](line) : line),
	);
}

export function showErrorBox(title: string, message: string): void {
	showBox(title, message, 'red');
}

export function showSuccessBox(title: string, message: string): void {
	showBox(title, message, 'green');
}

export function showWarningBox(title: string, message: string): void {
	showBox(title, message, 'magenta');
}
