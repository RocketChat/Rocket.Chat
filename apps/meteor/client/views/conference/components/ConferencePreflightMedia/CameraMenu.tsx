import { VIDEO_QUALITY_LABELS, choicesOf, useCallDevicesInitialState, useVideoQualityPreference } from '@rocket.chat/ui-conference';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { usePreviewMedia } from './PreviewMediaContext';
import DeviceMenu from '../DeviceMenu/DeviceMenu';
import DeviceMenuDevices from '../DeviceMenu/DeviceMenuDevices';
import DeviceMenuOption from '../DeviceMenu/DeviceMenuOption';
import DeviceMenuSection from '../DeviceMenu/DeviceMenuSection';
import { deviceMenuRows, selectedDevice } from '../DeviceMenu/deviceMenuRows';

/** Which camera to arrive on, and how much detail it sends. */
const CameraMenu = () => {
	const { t } = useTranslation();
	const { capabilities, preview } = usePreviewMedia();
	const { devices, selectDevice } = useCallDevicesInitialState(capabilities);
	const { videoQuality, selectVideoQuality } = useVideoQualityPreference();

	const rows = useMemo(() => deviceMenuRows(preview.videoInputs), [preview.videoInputs]);
	const selected = selectedDevice(rows, devices.camId);

	return (
		<DeviceMenu icon='video' label={t('Camera')} current={selected?.name} disabled={!rows.length}>
			<DeviceMenuDevices rows={rows} selectedId={selected?.id} onSelect={(deviceId) => selectDevice('cam', deviceId)} />
			<DeviceMenuSection title={t('Video_quality')}>
				{choicesOf(VIDEO_QUALITY_LABELS).map((quality) => (
					<DeviceMenuOption
						key={quality}
						name={t(VIDEO_QUALITY_LABELS[quality])}
						selected={quality === videoQuality}
						onSelect={() => selectVideoQuality(quality)}
					/>
				))}
			</DeviceMenuSection>
		</DeviceMenu>
	);
};

export default CameraMenu;
