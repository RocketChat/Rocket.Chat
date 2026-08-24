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
		secondary={!on}
		danger={!on}
		aria-live='assertive'
		aria-pressed={!on}
		title={label}
		aria-label={label}
		onClick={onToggle}
		icon={
			<Icon
				size='x24'
				name={on ? ICONS[device].on : ICONS[device].off}
				{...(device === 'mic' && !on && { style: { transform: 'scaleX(-1)' } })}
			/>
		}
	/>
);

export default CallDeviceToggle;
