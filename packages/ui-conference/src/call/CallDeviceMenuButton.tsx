import { ActionButton } from '@rocket.chat/ui-voip';
import type { ComponentProps } from 'react';
import { forwardRef } from 'react';

/** What GenericMenu stamps onto the trigger it clones; `small` is dropped, since the fused control is always large. */
export type CallDeviceMenuButtonProps = { small?: boolean } & Omit<ComponentProps<typeof ActionButton>, 'icon'>;

/** The chevron that opens a device menu during a call, fused to the toggle beside it: `danger` while that one is red. */
const CallDeviceMenuButton = forwardRef<HTMLButtonElement, CallDeviceMenuButtonProps>(function CallDeviceMenuButton(
	{ small: _small, label, ...menuProps },
	ref,
) {
	// Spread because GenericMenu clones this trigger with the props that open the menu, which must reach the button.
	// Named after the spread, which carries the menu's name: the same as the toggle's beside it.
	return (
		<ActionButton secondary large flexShrink={1} flexGrow={0} {...menuProps} label={label} aria-label={label} icon='chevron-up' ref={ref} />
	);
});

export default CallDeviceMenuButton;
