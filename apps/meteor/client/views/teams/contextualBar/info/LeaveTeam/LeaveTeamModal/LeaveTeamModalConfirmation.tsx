import type { IRoom, Serialized } from '@rocket.chat/core-typings';
import { GenericModal } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

type LeaveTeamModalConfirmationProps = {
	onConfirm: (selectedRooms?: { [key: string]: Serialized<IRoom> & { isLastOwner?: boolean } }) => void;
	onClose: () => void;
	onCancel?: () => void;
	selectedRooms: {
		[key: string]: Serialized<IRoom> & { isLastOwner?: boolean };
	};
};

const LeaveTeamModalConfirmation = ({ selectedRooms, onConfirm, onCancel, onClose }: LeaveTeamModalConfirmationProps): ReactElement => {
	const { t } = useTranslation();

	return (
		<GenericModal
			variant='danger'
			title={t('Confirmation')}
			onConfirm={(): void => onConfirm(selectedRooms)}
			onCancel={onCancel || onClose}
			onClose={onClose}
			confirmText={t('Leave')}
			cancelText={onCancel ? t('Back') : t('Cancel')}
		>
			{t('Teams_leaving_team')}
		</GenericModal>
	);
};

export default LeaveTeamModalConfirmation;
