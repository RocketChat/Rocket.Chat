import { ActionButton } from '@rocket.chat/ui-voip';
import type { ComponentProps } from 'react';
import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

import VoiceActivity from './VoiceActivity';

/** What GenericMenu stamps onto the trigger it clones; `small` is dropped, since the fused control is always large. */
type MenuTriggerProps = { small?: boolean } & Omit<ComponentProps<typeof ActionButton>, 'label' | 'icon'>;

export type AudioDevicePickerButtonProps = MenuTriggerProps & {
	/** How loud the microphone is hearing, from 0 to 1. Shown in place of the chevron. */
	level: number;
	/** Whether the microphone is off: there is no activity to show, and the button is red like the mute toggle. */
	micMuted: boolean;
};

const AudioDevicePickerButton = forwardRef<HTMLButtonElement, AudioDevicePickerButtonProps>(function AudioDevicePickerButton(
	{ small: _small, level, micMuted, ...menuProps },
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
			icon={micMuted ? 'chevron-up' : <VoiceActivity level={level} size={24} />}
			ref={ref}
		/>
	);
});

export default AudioDevicePickerButton;
