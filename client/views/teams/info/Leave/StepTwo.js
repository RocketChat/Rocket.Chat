import React from 'react';

import GenericModal from '../../../../components/GenericModal';
import RoomLinkList from '../RoomLinkList';
import { useTranslation } from '../../../../contexts/TranslationContext';

export const StepTwo = ({ lastOwnerRooms, keptRooms, onConfirm, onCancel, onClose }) => {
	const t = useTranslation();

	const showLastOwnerWarning = !!Object.values(lastOwnerRooms).length;
	const showKeptChannels = !!Object.values(keptRooms).length;
	const showLeavingAllChannels = !(showLastOwnerWarning || showKeptChannels);

	return <GenericModal
		variant='danger'
		icon='info-circled'
		title={t('Confirmation')}
		onConfirm={onConfirm}
		onCancel={onCancel}
		onClose={onClose}
		confirmText={t('Remove')}
		cancelText={t('Back')}
	>
		{showLastOwnerWarning && <>
			<p>{t('Teams_channels_last_owner_leave_team_warning')}</p>
			<br />
			<p>
				{t('Teams_channels_last_owner_cant_leave_list')}{' '}
				<RoomLinkList rooms={lastOwnerRooms}/>
			</p>
			<br />
		</>}
		{showKeptChannels && <>
			<p>
				{t('Teams_channels_didnt_leave')}{' '}
				<RoomLinkList rooms={keptRooms}/>
			</p>
		</>}
		{showLeavingAllChannels && <p>{t('Teams_channels_leaving_all')}</p>}


	</GenericModal>;
};

export default StepTwo;
