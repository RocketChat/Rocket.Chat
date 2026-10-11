import type { ComponentProps } from 'react';
import { forwardRef } from 'react';

import ActionButton from './ActionButton';

type ActionButtonProps = ComponentProps<typeof ActionButton>;

export type DeviceMenuButtonProps = {
	/** Separate from `icon`, which GenericMenu overwrites on a disabled trigger. */
	menuIcon: ActionButtonProps['icon'];
	/** Stamped by GenericMenu on a disabled trigger; dropped, since it would shrink the button. */
	small?: boolean;
} & Omit<ActionButtonProps, 'icon'>;

/** The trigger of a device menu, for `DeviceMenu`'s `button`. */
const DeviceMenuButton = forwardRef<HTMLButtonElement, DeviceMenuButtonProps>(function DeviceMenuButton(
	{ small: _small, label, menuIcon, ...menuProps },
	ref,
) {
	// Spread because GenericMenu clones this trigger with the props that open the menu, which must reach the button.
	// Named and drawn after the spread, which carries the menu's own name and icon.
	return <ActionButton flexShrink={1} flexGrow={0} {...menuProps} label={label} aria-label={label} icon={menuIcon} ref={ref} />;
});

export default DeviceMenuButton;
