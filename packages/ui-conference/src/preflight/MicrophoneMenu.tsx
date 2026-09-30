import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import DeviceMenu from './DeviceMenu';
import DeviceMenuDevices from './DeviceMenuDevices';
import { usePreviewMedia } from './PreviewMediaContext';
import { deviceMenuRows, selectedDevice } from './deviceMenuRows';
import { useCallDevicesInitialState } from '../hooks/useCallDevicesInitialState';

/** Which microphone to arrive on. */
const MicrophoneMenu = () => {
	const { t } = useTranslation();
	const { capabilities, preview } = usePreviewMedia();
	const { devices, selectDevice } = useCallDevicesInitialState(capabilities);

	const rows = useMemo(() => deviceMenuRows(preview.audioInputs), [preview.audioInputs]);
	const selected = selectedDevice(rows, devices.micId);

	return (
		<DeviceMenu icon='mic' label={t('Microphone')} current={selected?.name} disabled={!rows.length}>
			<DeviceMenuDevices rows={rows} selectedId={selected?.id} onSelect={(deviceId) => selectDevice('mic', deviceId)} />
		</DeviceMenu>
	);
};

export default MicrophoneMenu;
