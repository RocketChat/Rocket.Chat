import { Box, RadioButton } from '@rocket.chat/fuselage';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useAvailableDevices, useSelectedDevices, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { useVoipAPI } from '../../../hooks/useVoipAPI';

// TODO: Ensure that there's never more than one default device item
// if there's more than one, we need to change the label and id.
const getDefaultDeviceItem = (label: string, type: 'input' | 'output') => ({
	content: (
		<Box is='span' title={label} fontSize={14}>
			{label}
		</Box>
	),
	addon: <RadioButton onChange={() => undefined} checked={true} disabled />,
	id: `default-${type}`,
});

export const useVoipDeviceSettings = () => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const { changeAudioInputDevice, changeAudioOutputDevice } = useVoipAPI();
	const availableDevices = useAvailableDevices();
	const selectedAudioDevices = useSelectedDevices();

	const changeInputDevice = useMutation({
		mutationFn: changeAudioInputDevice,
		onSuccess: () => dispatchToastMessage({ type: 'success', message: t('Devices_Set') }),
		onError: (error) => dispatchToastMessage({ type: 'error', message: error }),
	});

	const changeOutputDevice = useMutation({
		mutationFn: changeAudioOutputDevice,
		onSuccess: () => dispatchToastMessage({ type: 'success', message: t('Devices_Set') }),
		onError: (error) => dispatchToastMessage({ type: 'error', message: error }),
	});

	const availableInputDevice =
		availableDevices?.audioInput?.map<GenericMenuItemProps>((device) => {
			if (!device.id || !device.label) {
				return getDefaultDeviceItem(t('Default'), 'input');
			}

			return {
				// We need to change the id because in some cases, the id is the same for input and output devices.
				// For example, in chrome, the `id` for the default input and output devices is the same ('default').
				// Also, some devices can have different functions for the same device (such as a webcam that has a microphone)
				id: `${device.id}-input`,
				content: (
					<Box is='span' title={device.label} fontSize={14}>
						{device.label}
					</Box>
				),
				addon: (
					<RadioButton onChange={() => changeInputDevice.mutate(device)} checked={device.id === selectedAudioDevices?.audioInput?.id} />
				),
			};
		}) || [];

	const availableOutputDevice =
		availableDevices?.audioOutput?.map<GenericMenuItemProps>((device) => {
			if (!device.id || !device.label) {
				return getDefaultDeviceItem(t('Default'), 'output');
			}

			return {
				// Same here, the id's might not be unique.
				id: `${device.id}-output`,
				content: (
					<Box is='span' title={device.label} fontSize={14}>
						{device.label}
					</Box>
				),
				addon: (
					<RadioButton onChange={() => changeOutputDevice.mutate(device)} checked={device.id === selectedAudioDevices?.audioOutput?.id} />
				),
				onClick(e?: MouseEvent<HTMLElement>) {
					e?.preventDefault();
					e?.stopPropagation();
				},
			};
		}) || [];

	const micSection = {
		title: t('Microphone'),
		items: availableInputDevice,
	};

	const speakerSection = {
		title: t('Speaker'),
		items: availableOutputDevice,
	};

	const disabled = availableOutputDevice.length === 0 && availableInputDevice.length === 0;

	return {
		disabled,
		title: disabled ? t('Device_settings_not_supported_by_browser') : t('Device_settings'),
		sections: [micSection, speakerSection],
	};
};
