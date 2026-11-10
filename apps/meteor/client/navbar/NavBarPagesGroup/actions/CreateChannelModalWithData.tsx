import { useTranslation } from 'react-i18next';

import type { CreateChannelModalProps } from './CreateChannelModal';
import CreateChannelModal from './CreateChannelModal';
import { CreateRoomModalSkeleton, useAbacRoomCreation } from '../../../components/ABAC/AbacRoomCreation';

const CreateChannelModalWithData = (props: Omit<CreateChannelModalProps, 'abac'>) => {
	const { t } = useTranslation();
	const { isLoading, abac } = useAbacRoomCreation();

	if (isLoading) {
		return <CreateRoomModalSkeleton title={t('Create_channel')} onClose={props.onClose} />;
	}

	return <CreateChannelModal {...props} abac={abac} />;
};

export default CreateChannelModalWithData;
