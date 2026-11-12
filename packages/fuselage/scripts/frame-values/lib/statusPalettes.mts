import { statusBackgroundColors, statusColors } from '../../../src/Theme.ts';

export const statusTones = ['info', 'success', 'warning', 'danger'] as const;

export type StatusTone = (typeof statusTones)[number];

/** The text-on-status and status background colours of each tone, which Callout, Banner, ToastBar, ProgressBar, FramedIcon and States paint with. */
export const statusPalettes = () =>
	Object.fromEntries(
		statusTones.map((tone) => [
			tone,
			{
				font: statusColors[`status-font-on-${tone}`].toString(),
				background: statusBackgroundColors[`status-background-${tone}`].toString(),
			},
		]),
	) as Record<StatusTone, { font: string; background: string }>;
