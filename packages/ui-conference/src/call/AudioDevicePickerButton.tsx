import { ActionButton } from '@rocket.chat/ui-voip';
import type { ComponentProps } from 'react';
import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

/** What GenericMenu stamps onto the trigger it clones; `small` is dropped, since the fused control is always large. */
type MenuTriggerProps = { small?: boolean } & Omit<ComponentProps<typeof ActionButton>, 'label' | 'icon'>;

export type AudioDevicePickerButtonProps = MenuTriggerProps & {
	/** Coloured like the mute toggle it is fused to, which is red while the microphone is off. */
	micMuted: boolean;
};

const AudioDevicePickerButton = forwardRef<HTMLButtonElement, AudioDevicePickerButtonProps>(function AudioDevicePickerButton(
	{ small: _small, micMuted, ...menuProps },
	ref,
) {
	const { t } = useTranslation();

	return (
		<ActionButton
			secondary
			large
			danger={micMuted}
			flexShrink={1}
			flexGrow={0}
			// Spread because GenericMenu clones this trigger with the props that open the menu, which must reach the button.
			{...menuProps}
			label={t('Audio_device_options')}
			icon='chevron-up'
			ref={ref}
		/>
	);
});

export default AudioDevicePickerButton;
