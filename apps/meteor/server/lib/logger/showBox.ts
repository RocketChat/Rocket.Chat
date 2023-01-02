import s from 'underscore.string';
import { createColors } from 'colorette';

// force enable colors on dev env
const colors = createColors({
	useColor: process.env.NODE_ENV !== 'production',
});

type LogColors = 'white' | 'blue' | 'green' | 'magenta' | 'red';

export function showBox(title: string, message: string, color?: LogColors): void {
	const msgLines = message.split('\n');

	const len = Math.max.apply(
		null,
		msgLines.map((line) => line.length),
	);

	const topLine = `+--${s.pad('', len, '-')}--+`;
	const separator = `|  ${s.pad('', len, '')}  |`;

	const lines = [];

	lines.push(topLine);
	if (title) {
		lines.push(`|  ${s.lrpad(title, len)}  |`);
		lines.push(topLine);
	}
	lines.push(separator);

	[...lines, ...msgLines.map((line) => `|  ${s.rpad(line, len)}  |`), separator, topLine].forEach((line) =>
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
