import { Box, RadioButton } from '@rocket.chat/fuselage';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import CameraPickerButton from './CameraPickerButton';
import { useCallDeviceSelection, useCallState } from './context';
import { SYSTEM_DEFAULT_DEVICE_ID, deviceName, orderDevices } from './lib/deviceLabels';
import { VIDEO_QUALITY_LABELS } from './lib/mediaChoiceLabels';

/** Prefixed ids, so the rows in the menu that are not cameras are not mistaken for cameras. */
const VIDEO_QUALITY_PREFIX = 'video-quality:';

/** The camera of a call running in this window, with the quality it sends. */
const CameraPicker = () => {
	const { t } = useTranslation();
	const { self } = useCallState();
	const { devices, selectCamera, currentCameraId: currentCameraDeviceId, videoQuality } = useCallDeviceSelection();

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

	// The most detail to send: a ceiling rather than a promise, which is why each row says the size it asks for and
	// the one in use says what the camera actually gave — they are not always the same number.
	const qualityItems: GenericMenuItemProps[] = videoQuality.qualities.map((quality) => ({
		id: `${VIDEO_QUALITY_PREFIX}${quality}`,
		textValue: t(VIDEO_QUALITY_LABELS[quality]),
		content: (
			<Box display='flex' flexDirection='column' fontScale='p2' minWidth={0}>
				<Box is='span' withTruncatedText>
					{t(VIDEO_QUALITY_LABELS[quality])}
				</Box>
				{videoQuality.quality === quality && videoQuality.height && (
					<Box is='span' fontScale='c1' color='hint'>
						{t('Video_quality_sending__height__p', { height: videoQuality.height })}
					</Box>
				)}
			</Box>
		),
		addon: <RadioButton checked={videoQuality.quality === quality} disabled={videoQuality.pending} readOnly />,
	}));

	const qualitySection = { title: t('Video_quality'), items: qualityItems };

	const cameraSection = { title: t('Camera'), items };
	const sections = [cameraSection, ...(qualityItems.length ? [qualitySection] : [])];

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
				if (deviceId.startsWith(VIDEO_QUALITY_PREFIX)) {
					const quality = videoQuality.qualities.find((quality) => `${VIDEO_QUALITY_PREFIX}${quality}` === deviceId);
					if (quality) videoQuality.select(quality);
					return;
				}
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
