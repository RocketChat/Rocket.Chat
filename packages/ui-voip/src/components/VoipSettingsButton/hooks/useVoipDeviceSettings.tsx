import { Box, RadioButton } from '@rocket.chat/fuselage';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useAvailableDevices, useSelectedDevices, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { useVoipAPI } from '../../../hooks/useVoipAPI';

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
		availableDevices?.audioInput?.map<GenericMenuItemProps>((device) => ({
			id: device.id,
			content: (
				<Box is='span' title={device.label} fontSize={14}>
					{device.label}
				</Box>
			),
			addon: <RadioButton onChange={() => changeInputDevice.mutate(device)} checked={device.id === selectedAudioDevices?.audioInput?.id} />,
		})) || [];

	const availableOutputDevice =
		availableDevices?.audioOutput?.map<GenericMenuItemProps>((device) => ({
			id: device.id,
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
		})) || [];

	const micSection = {
		title: t('Microphone'),
		items: availableInputDevice,
	};

	const speakerSection = {
		title: t('Speaker'),
		items: availableOutputDevice,
	};

	const disabled = !micSection.items.length || !speakerSection.items.length;

	return {
		disabled,
		title: disabled ? t('Device_settings_not_supported_by_browser') : t('Device_settings'),
		sections: [micSection, speakerSection],
	};
};
