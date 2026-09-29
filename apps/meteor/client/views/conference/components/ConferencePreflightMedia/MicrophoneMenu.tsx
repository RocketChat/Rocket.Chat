import { useCallDevicesInitialState } from '@rocket.chat/ui-conference';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { usePreviewMedia } from './PreviewMediaContext';
import DeviceMenu from '../DeviceMenu/DeviceMenu';
import DeviceMenuDevices from '../DeviceMenu/DeviceMenuDevices';
import { deviceMenuRows, selectedDevice } from '../DeviceMenu/deviceMenuRows';

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
