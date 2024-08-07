import { Box, RadioButton } from '@rocket.chat/fuselage';
import { useAvailableDevices, useSelectedDevices, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import React from 'react';

import type { GenericMenuItemProps } from '../../components/GenericMenu/GenericMenuItem';
import useVoiceCallAPI from './useVoiceCallAPI';

export const useVoiceCallSettingsMenu = () => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const { changeAudioInputDevice, changeAudioOutputDevice } = useVoiceCallAPI();
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
			onClick(e) {
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

	return [micSection, speakerSection];
};

export default useVoiceCallSettingsMenu;
