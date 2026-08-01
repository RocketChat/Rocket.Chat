import { css } from '@rocket.chat/css-in-js';
import { Box, Icon, IconButton } from '@rocket.chat/fuselage';
import type { Keys } from '@rocket.chat/icons';
import type { ReactNode } from 'react';

export type JoinedButtonGroupState = 'on' | 'off' | 'active' | 'unavailable';

export type JoinedButtonGroupProps = {
	/**
	 * on — device/tool available and idle (secondary);
	 * off — turned off / blocked (secondary-danger, slashed icon);
	 * active — lit tool state (primary), e.g. captions on or sharing;
	 * unavailable — no device at all: chevron hidden, danger button only.
	 */
	state: JoinedButtonGroupState;
	label: string;
	/** [on/active icon, off/unavailable icon] */
	icons: [onIcon: Keys, offIcon: Keys];
	/** tooltip — explains why when off/unavailable */
	title: string;
	onToggle?: () => void;
	/** the device-picker menu rendered as the attached chevron (left half) */
	menu?: ReactNode;
};

// Figma "_[Local] Joined button group": an attached split button — device
// menu chevron on a translucent dark backdrop + the toggle itself, sharing
// one 4px-radius clip so the pair reads as a single control.
const groupStyles = css`
	display: inline-flex;
	align-items: stretch;
	border-radius: 0.25rem;
	overflow: hidden;
	background: rgba(64, 71, 84, 0.6);

	& button {
		border-radius: 0;
		block-size: 2rem;
		min-block-size: 2rem;
		inline-size: 2rem;
		min-inline-size: 2rem;
		padding: 0.5rem;
	}
`;

const JoinedButtonGroup = ({ state, label, icons, title, onToggle, menu }: JoinedButtonGroupProps) => {
	const off = state === 'off' || state === 'unavailable';
	const iconName = off ? icons[1] : icons[0];

	return (
		<Box className={groupStyles}>
			{state !== 'unavailable' && menu}
			{/* off/unavailable = secondary-danger look: neutral secondary bg
			    with a danger-coloured slashed icon (never solid danger — red
			    fill is reserved for hanging up) */}
			<IconButton
				small
				secondary={state !== 'active'}
				primary={state === 'active'}
				icon={<Icon size={16} color={off ? 'font-danger' : undefined} name={iconName} />}
				label={label}
				aria-label={label}
				title={title}
				aria-pressed={state === 'active' || state === 'off'}
				onClick={onToggle}
			/>
		</Box>
	);
};

export default JoinedButtonGroup;
