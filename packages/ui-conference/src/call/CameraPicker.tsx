import { useTranslation } from 'react-i18next';

import CallDeviceMenuButton from './CallDeviceMenuButton';
import { useCallState } from './context';
import DeviceMenu from '../devices/DeviceMenu';

/** The camera of a call running in this window. */
const CameraPicker = () => {
	const { t } = useTranslation();
	const { self } = useCallState();

	return (
		<DeviceMenu
			kinds={['videoinput']}
			title={t('Camera')}
			placement='top-end'
			button={<CallDeviceMenuButton label={t('Camera_options')} danger={!self.cameraOn} />}
		/>
	);
};

export default CameraPicker;
