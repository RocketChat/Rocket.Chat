import { IconButton } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

import { usePinFocus } from './hooks/usePinFocus';

export type PinToggleProps = {
	pinned: boolean;
	/** Names the control in both states; only the title says what a press undoes. */
	label: string;
	unpinTitle: string;
	/** Tells this pin from the others on the stage. */
	focusKey: string;
	/** Replaces the pin where a row offers more than one. */
	icon?: ComponentProps<typeof IconButton>['icon'];
	onToggle: () => void;
};

const PinToggle = ({ pinned, label, unpinTitle, focusKey, icon, onToggle }: PinToggleProps) => {
	const [focusRef, keepFocus] = usePinFocus(focusKey);

	return (
		<IconButton
			ref={focusRef}
			size='small'
			variant='secondary'
			icon={icon ?? (pinned ? 'pin-filled' : 'pin')}
			pressed={pinned}
			aria-pressed={pinned}
			aria-label={label}
			title={pinned ? unpinTitle : label}
			onClick={(event) => {
				keepFocus(event.currentTarget);
				onToggle();
			}}
		/>
	);
};

export default PinToggle;
