import { Box, RadioButton } from '@rocket.chat/fuselage';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useAvailableDevices, useSelectedDevices } from '@rocket.chat/ui-contexts';
import type { ComponentProps, MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { ActionButton } from '.';
import { useMediaCallContext } from '../MediaCallContext';

// GenericMenu for some reason passes `small: true` when the button is disabled (??).
// so this is just a wrapper to stop that from happening.
const DevicePickerButton = ({
	secondary = false,
	small: _small,
	...props
}: { secondary?: boolean; small?: boolean } & Omit<ComponentProps<typeof ActionButton>, 'label' | 'icon'>) => {
	return <ActionButton secondary={secondary} {...props} label='customize' icon='customize' />;
};

// eslint-disable-next-line react/no-multi-comp
const DevicePicker = ({ secondary = false }: { secondary?: boolean }) => {
	const { t } = useTranslation();

	const { onDeviceChange } = useMediaCallContext();

	const availableDevices = useAvailableDevices();
	const selectedAudioDevices = useSelectedDevices();

	const availableInputDevice =
		availableDevices?.audioInput?.map<GenericMenuItemProps>((device) => ({
			id: device.id,
			content: (
				<Box is='span' title={device.label} fontSize={14}>
					{device.label}
				</Box>
			),
			addon: <RadioButton onChange={() => onDeviceChange(device.id)} checked={device.id === selectedAudioDevices?.audioInput?.id} />,
		})) || [];

	const availableOutputDevice =
		availableDevices?.audioOutput?.map<GenericMenuItemProps>((device) => ({
			id: device.id,
			content: (
				<Box is='span' title={device.label} fontSize={14}>
					{device.label}
				</Box>
			),
			addon: <RadioButton onChange={() => onDeviceChange(device.id)} checked={device.id === selectedAudioDevices?.audioOutput?.id} />,
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

	return (
		<GenericMenu
			title={disabled ? t('Device_settings_not_supported_by_browser') : t('Device_settings')}
			sections={[micSection, speakerSection]}
			disabled={disabled}
			selectionMode='multiple'
			button={<DevicePickerButton secondary={secondary} />}
		/>
	);
};

export default DevicePicker;
