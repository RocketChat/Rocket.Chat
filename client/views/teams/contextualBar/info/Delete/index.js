import { Skeleton } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';

import GenericModal from '../../../../../components/GenericModal';
import { useTranslation } from '../../../../../contexts/TranslationContext';
import { AsyncStatePhase } from '../../../../../hooks/useAsyncState';
import { useEndpointData } from '../../../../../hooks/useEndpointData';
import DeleteTeamModal from './DeleteTeamModal';
import StepOne from './StepOne';
import StepTwo from './StepTwo';

const DeleteTeamModalWithRooms = ({ teamId, onConfirm, onCancel }) => {
	const { value, phase } = useEndpointData(
		'teams.listRooms',
		useMemo(() => ({ teamId }), [teamId]),
	);

	const t = useTranslation();

	if (phase === AsyncStatePhase.LOADING) {
		return (
			<GenericModal
				variant='warning'
				onClose={onCancel}
				onConfirm={onCancel}
				title={<Skeleton width='50%' />}
				confirmText={t('Cancel')}
			>
				<Skeleton width='full' />
			</GenericModal>
		);
	}
	return <DeleteTeamModal onCancel={onCancel} onConfirm={onConfirm} rooms={value?.rooms} />;
};

export { StepOne, StepTwo };

export default DeleteTeamModalWithRooms;
