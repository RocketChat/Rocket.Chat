import type { Serialized, IRoom } from '@rocket.chat/core-typings';
import { Icon } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import GenericModal from '../../../../../components/GenericModal';

type RemoveUsersSecondStepProps = {
	onClose: () => void;
	onCancel: () => void;
	onConfirm: (deletedRooms: { [key: string]: Serialized<IRoom> }) => void;
	deletedRooms: {
		[key: string]: Serialized<IRoom>;
	};
	rooms?: { _id: string; t: string; name?: string; fname?: string; isLastOwner?: boolean }[];
	username?: string;
};

const RemoveUsersSecondStep = ({
	onClose,
	onCancel,
	onConfirm,
	deletedRooms = {},
	username,
	rooms = [],
	...props
}: RemoveUsersSecondStepProps) => {
	const { t } = useTranslation();

	return (
		<GenericModal
			variant='danger'
			icon={<Icon name='modal-warning' size='x24' color='status-font-on-warning' />}
			cancelText={rooms?.length > 0 ? t('Back') : t('Cancel')}
			confirmText={t('Remove')}
			title={t('Confirmation')}
			onClose={onClose}
			onCancel={onCancel}
			onConfirm={() => onConfirm(deletedRooms)}
			{...props}
		>
			{t('Teams_removing__username__from_team', { username })}
		</GenericModal>
	);
};

export default RemoveUsersSecondStep;
