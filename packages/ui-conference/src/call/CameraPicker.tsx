import { Box, RadioButton } from '@rocket.chat/fuselage';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import CameraPickerButton from './CameraPickerButton';
import { useCallDeviceSelection, useCallState } from './context';
import { SYSTEM_DEFAULT_DEVICE_ID, deviceName, orderDevices } from './lib/deviceLabels';

/** The camera of a call running in this window. */
const CameraPicker = () => {
	const { t } = useTranslation();
	const { self } = useCallState();
	const { devices, selectCamera, currentCameraId: currentCameraDeviceId } = useCallDeviceSelection();

	const ordered = useMemo(() => orderDevices(devices.filter(({ kind }) => kind === 'videoinput')), [devices]);

	// What is in use when nothing has been picked is the first on offer, which is what makes clicking it a no-op
	// below rather than a switch to the camera already running.
	const currentId = currentCameraDeviceId ?? ordered[0]?.deviceId;

	const items: GenericMenuItemProps[] = ordered.map((device) => {
		const name = deviceName(device.label) || t('Default');

		return {
			id: `${device.deviceId}-videoinput`,
			textValue: name,
			content: (
				<Box title={name} fontScale='p2' display='flex' flexDirection='column' minWidth={0}>
					<Box is='span' withTruncatedText>
						{name}
					</Box>
					{/* Said on its own line, as a fact about the device rather than part of its name. */}
					{device.deviceId === SYSTEM_DEFAULT_DEVICE_ID && (
						<Box is='span' fontScale='c1' color='hint'>
							{t('System_default')}
						</Box>
					)}
				</Box>
			),
			addon: <RadioButton checked={device.deviceId === currentId} />,
		};
	});

	const sections = [{ title: t('Camera'), items }];

	const disabled = items.length === 0;

	const [isOpen, setIsOpen] = useSafely(useState(false));

	return (
		<GenericMenu
			title={disabled ? t('Device_settings_not_supported_by_browser') : t('Camera')}
			sections={sections}
			disabled={disabled}
			placement='top-end'
			selectionMode='single'
			isOpen={isOpen}
			onOpenChange={setIsOpen}
			onAction={(deviceId) => {
				if (typeof deviceId !== 'string') return;
				if (!deviceId.endsWith('-videoinput')) return;
				const id = deviceId.slice(0, -'-videoinput'.length);
				// Switching to the camera already in use restarts its track, which comes back as a black frame.
				if (id === currentId) return;
				selectCamera(id);
			}}
			button={<CameraPickerButton cameraOff={!self.cameraOn} />}
		/>
	);
};

export default CameraPicker;
