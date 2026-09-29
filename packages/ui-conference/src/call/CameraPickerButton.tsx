import { ActionButton } from '@rocket.chat/ui-voip';
import type { ComponentProps } from 'react';
import { forwardRef } from 'react';

/** What GenericMenu stamps onto the trigger it clones; `small` is dropped, since the fused control is always large. */
type MenuTriggerProps = { small?: boolean } & Omit<ComponentProps<typeof ActionButton>, 'label' | 'icon'>;

export type CameraPickerButtonProps = MenuTriggerProps & {
	/** Coloured like the camera toggle it is fused to, which is red while the camera is off. */
	cameraOff: boolean;
};

const CameraPickerButton = forwardRef<HTMLButtonElement, CameraPickerButtonProps>(function CameraPickerButton(
	{ small: _small, cameraOff, ...menuProps },
	ref,
) {
	// Spread because GenericMenu clones this trigger with the props that open the menu, which must reach the button.
	return (
		<ActionButton
			secondary
			large
			danger={cameraOff}
			flexShrink={1}
			flexGrow={0}
			{...menuProps}
			label='Camera options'
			icon='chevron-up'
			ref={ref}
		/>
	);
});

export default CameraPickerButton;
