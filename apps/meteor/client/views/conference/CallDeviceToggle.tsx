import { css } from '@rocket.chat/css-in-js';
import { Icon, IconButton } from '@rocket.chat/fuselage';

type CallDeviceToggleProps = {
	device: 'mic' | 'cam';
	/** Whether the device will be on. Off is the state worth shouting about, so off is the one that goes red. */
	on: boolean;
	label: string;
	onToggle: () => void;
};

const ICONS = {
	mic: { on: 'mic', off: 'mic-off' },
	cam: { on: 'video', off: 'video-off' },
} as const;

/**
 * Filled red, from the same tokens the danger buttons use. `IconButton`'s own `danger` is the ghost variant —
 * a red glyph on nothing — which is too quiet for the one state the user has to notice at a glance.
 */
const offStyle = css`
	background-color: var(--rcx-color-button-background-danger-default);
	color: var(--rcx-color-button-font-on-danger);

	&:hover,
	&:focus {
		background-color: var(--rcx-color-button-background-danger-hover);
	}

	&:active {
		background-color: var(--rcx-color-button-background-danger-press);
	}
`;

/**
 * A mic or camera toggle for the preflight, in the convention every call UI uses: **off is red**, because a
 * muted mic or a dark camera is the state a user needs to notice at a glance. On is left as a ghost button —
 * nothing to report.
 *
 * `mic-off` slashes the other way from `video-off`, so beside each other they read as two unrelated marks. The
 * mic is mirrored to match, which flips its slash without visibly changing the mic itself — it is symmetric
 * about that axis.
 */
const CallDeviceToggle = ({ device, on, label, onToggle }: CallDeviceToggleProps) => (
	<IconButton
		medium
		className={on ? undefined : offStyle}
		aria-live='assertive'
		aria-pressed={!on}
		title={label}
		aria-label={label}
		onClick={onToggle}
		icon={
			<Icon
				size='x20'
				name={on ? ICONS[device].on : ICONS[device].off}
				{...(device === 'mic' && !on && { style: { transform: 'scaleX(-1)' } })}
			/>
		}
	/>
);

export default CallDeviceToggle;
