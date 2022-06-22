import React from 'react';
import GenericModal from '../../../../../client/components/GenericModal';

const DeviceManagementFeatureModal = ({ close }: { close: () => void }) => {

	return (
			<GenericModal onConfirm={close} onCancel={close} onClose={close}>

			</GenericModal>
	);
};

export default DeviceManagementFeatureModal;
