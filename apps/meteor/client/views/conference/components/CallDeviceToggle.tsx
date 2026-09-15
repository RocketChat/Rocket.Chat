import type { Icon as IconComponent } from '@rocket.chat/fuselage';
import { Icon, IconButton } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

type CallDeviceToggleProps = {
	device: 'mic' | 'cam';
	/** Whether the device will be on. Off is the state worth shouting about, so off is the one that goes red. */
	on: boolean;
	label: string;
	onToggle: () => void;
};

const getDeviceIcon = (device: CallDeviceToggleProps['device'], on: boolean): ComponentProps<typeof IconComponent>['name'] => {
	switch (device) {
		case 'mic':
			return on ? 'mic' : 'mic-off';
		case 'cam':
		default:
			return on ? 'video' : 'video-off';
	}
};

/**
 * A mic or camera toggle for the preflight, in the convention every call UI uses: **off is red**, because a
 * muted mic or a dark camera is the state a user needs to notice at a glance. On is left as a ghost button —
 * nothing to report.
 */
const CallDeviceToggle = ({ device, on, label, onToggle }: CallDeviceToggleProps) => (
	<IconButton
		secondary
		danger={!on}
		aria-live='assertive'
		// The toggle is engaged when the device is on, whatever the styling does — a screen reader must not be told
		// the mic is idle while it is live.
		aria-pressed={on}
		title={label}
		aria-label={label}
		onClick={onToggle}
		icon={<Icon size='x24' name={getDeviceIcon(device, on)} />}
	/>
);

export default CallDeviceToggle;
