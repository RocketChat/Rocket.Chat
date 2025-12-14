import { Box, RadioButton } from '@rocket.chat/fuselage';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useAvailableDevices, useSelectedDevices } from '@rocket.chat/ui-contexts';
import type { ComponentProps, MouseEvent } from 'react';
import { forwardRef, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ActionButton } from '.';
import { useMediaCallContext } from '../context';
import { useDevicePermissionPrompt2, stopTracks } from '../hooks/useDevicePermissionPrompt';

type DevicePickerButtonProps = {
	secondary?: boolean;
	small?: boolean;
} & Omit<ComponentProps<typeof ActionButton>, 'label' | 'icon'>;

// GenericMenu for some reason passes `small: true` when the button is disabled (??).
// so this is just a wrapper to stop that from happening.
const DevicePickerButton = forwardRef<HTMLButtonElement, DevicePickerButtonProps>(function DevicePickerButton(
	{ secondary = false, small: _small, ...props },
	ref,
) {
	return <ActionButton secondary={secondary} {...props} label='customize' icon='customize' ref={ref} />;
});

const getDefaultDeviceItem = (label: string, type: 'input' | 'output') => ({
	content: (
		<Box is='span' title={label} fontSize={14}>
			{label}
		</Box>
	),
	addon: <RadioButton onChange={() => undefined} checked={true} disabled />,
	id: `default-${type}`,
});

// eslint-disable-next-line react/no-multi-comp
const DevicePicker = ({ secondary = false }: { secondary?: boolean }) => {
	const { t } = useTranslation();

	const { onDeviceChange } = useMediaCallContext();

	const availableDevices = useAvailableDevices();
	const selectedAudioDevices = useSelectedDevices();

	const availableInputDevice =
		availableDevices?.audioInput?.map<GenericMenuItemProps>((device) => {
			if (!device.id || !device.label) {
				return getDefaultDeviceItem(t('Default'), 'input');
			}

			return {
				id: `${device.id}-input`,
				content: (
					<Box is='span' title={device.label} fontSize={14}>
						{device.label}
					</Box>
				),
				addon: <RadioButton checked={device.id === selectedAudioDevices?.audioInput?.id} />,
			};
		}) || [];

	const availableOutputDevice =
		availableDevices?.audioOutput?.map<GenericMenuItemProps>((device) => {
			if (!device.id || !device.label) {
				return getDefaultDeviceItem(t('Default'), 'output');
			}

			return {
				id: `${device.id}-output`,
				content: (
					<Box is='span' title={device.label} fontSize={14}>
						{device.label}
					</Box>
				),
				addon: <RadioButton checked={device.id === selectedAudioDevices?.audioOutput?.id} />,
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

	const [isOpen, setIsOpen] = useSafely(useState(false));

	const requestPermission = useDevicePermissionPrompt2();

	const onOpenChange = useCallback(
		(isOpen: boolean) => {
			if (!isOpen) {
				setIsOpen(false);
				return;
			}

			void requestPermission({
				actionType: 'device-change',
			}).then((stream) => {
				stopTracks(stream);
				setIsOpen(true);
			});
		},
		[requestPermission, setIsOpen],
	);

	return (
		<GenericMenu
			title={disabled ? t('Device_settings_not_supported_by_browser') : t('Device_settings_lowercase')}
			sections={[micSection, speakerSection]}
			disabled={disabled}
			placement='top-end'
			selectionMode='multiple'
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			onAction={(deviceId) => {
				if (typeof deviceId !== 'string') {
					return;
				}

				if (deviceId.includes('-input')) {
					const id = deviceId.replace('-input', '');
					const device = availableDevices?.audioInput?.find((device) => device.id === id);
					if (device) {
						onDeviceChange(device);
					}
					return;
				}

				if (deviceId.includes('-output')) {
					const id = deviceId.replace('-output', '');
					const device = availableDevices?.audioOutput?.find((device) => device.id === id);
					if (device) {
						onDeviceChange(device);
					}
					return;
				}

				console.warn('Device Picker - Failed to select device: Invalid deviceId', deviceId);
			}}
			button={<DevicePickerButton secondary={secondary} tiny={!secondary} />}
		/>
	);
};

export default DevicePicker;
