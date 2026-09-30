import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import DeviceMenu from './DeviceMenu';
import DeviceMenuDevices from './DeviceMenuDevices';
import { usePreviewMedia } from './PreviewMediaContext';
import { deviceMenuRows, selectedDevice } from './deviceMenuRows';
import { useCallDevicesInitialState } from '../hooks/useCallDevicesInitialState';

/** Which speaker to arrive on. */
const SpeakerMenu = () => {
	const { t } = useTranslation();
	const { capabilities, preview } = usePreviewMedia();
	const { devices, selectDevice } = useCallDevicesInitialState(capabilities);

	const rows = useMemo(() => deviceMenuRows(preview.audioOutputs), [preview.audioOutputs]);
	const selected = selectedDevice(rows, devices.speakerId);

	return (
		<DeviceMenu icon='volume' label={t('Speaker')} current={selected?.name} disabled={!rows.length}>
			<DeviceMenuDevices rows={rows} selectedId={selected?.id} onSelect={(deviceId) => selectDevice('speaker', deviceId)} />
		</DeviceMenu>
	);
};

export default SpeakerMenu;
