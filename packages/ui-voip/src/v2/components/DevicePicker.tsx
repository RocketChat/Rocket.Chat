import { Box, RadioButton } from '@rocket.chat/fuselage';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useAvailableDevices, useSelectedDevices } from '@rocket.chat/ui-contexts';
import type { ComponentProps, MouseEvent } from 'react';
import { forwardRef, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ActionButton } from '.';
import { useDevicePermissionPrompt } from '../../hooks/useDevicePermissionPrompt';
import { useMediaCallContext } from '../MediaCallContext';

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

	const [isOpen, setIsOpen] = useSafely(useState(false));

	const _onOpenChange = useDevicePermissionPrompt({
		actionType: 'device-change',
		onAccept: () => {
			setIsOpen(true);
		},
		onReject: () => {
			setIsOpen(false);
		},
	});

	const onOpenChange = useCallback(
		(isOpen: boolean) => {
			if (isOpen) {
				_onOpenChange();
				return;
			}

			setIsOpen(isOpen);
		},
		[_onOpenChange, setIsOpen],
	);

	return (
		<GenericMenu
			title={disabled ? t('Device_settings_not_supported_by_browser') : t('Device_settings')}
			sections={[micSection, speakerSection]}
			disabled={disabled}
			placement='top-end'
			selectionMode='multiple'
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			button={<DevicePickerButton secondary={secondary} tiny={!secondary} />}
		/>
	);
};

export default DevicePicker;
