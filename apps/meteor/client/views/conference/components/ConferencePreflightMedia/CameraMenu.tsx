import { useCallDevicesInitialState } from '@rocket.chat/ui-conference';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { usePreviewMedia } from './PreviewMediaContext';
import DeviceMenu from '../DeviceMenu/DeviceMenu';
import DeviceMenuDevices from '../DeviceMenu/DeviceMenuDevices';
import { deviceMenuRows, selectedDevice } from '../DeviceMenu/deviceMenuRows';

/** Which camera to arrive on. */
const CameraMenu = () => {
	const { t } = useTranslation();
	const { capabilities, preview } = usePreviewMedia();
	const { devices, selectDevice } = useCallDevicesInitialState(capabilities);

	const rows = useMemo(() => deviceMenuRows(preview.videoInputs), [preview.videoInputs]);
	const selected = selectedDevice(rows, devices.camId);

	return (
		<DeviceMenu icon='video' label={t('Camera')} current={selected?.name} disabled={!rows.length}>
			<DeviceMenuDevices rows={rows} selectedId={selected?.id} onSelect={(deviceId) => selectDevice('cam', deviceId)} />
		</DeviceMenu>
	);
};

export default CameraMenu;
