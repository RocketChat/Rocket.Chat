import { useTranslation } from 'react-i18next';

import type { CreateTeamModalProps } from './CreateTeamModal';
import CreateTeamModal from './CreateTeamModal';
import { CreateRoomModalSkeleton, useAbacRoomCreation } from '../../../components/ABAC/AbacRoomCreation';

const CreateTeamModalWithData = (props: Omit<CreateTeamModalProps, 'abac'>) => {
	const { t } = useTranslation();
	const { isLoading, abac } = useAbacRoomCreation();

	if (isLoading) {
		return <CreateRoomModalSkeleton title={t('Teams_New_Title')} onClose={props.onClose} />;
	}

	return <CreateTeamModal {...props} abac={abac} />;
};

export default CreateTeamModalWithData;
