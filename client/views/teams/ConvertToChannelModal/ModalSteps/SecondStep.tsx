import { Icon } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import { IRoom } from '../../../../../definition/IRoom';
import GenericModal from '../../../../components/GenericModal';
import { useTranslation } from '../../../../contexts/TranslationContext';

type SecondStepsProps = {
	onClose: () => void;
	onCancel: () => void;
	onConfirm: (deletedRooms: { [key: string]: IRoom }) => void;
	deletedRooms: {
		[key: string]: IRoom;
	};
	rooms: Array<IRoom & { isLastOwner?: string }> | undefined;
};

const SecondStep: FC<SecondStepsProps> = ({
	onClose,
	onCancel,
	onConfirm,
	deletedRooms = {},
	rooms = [],
	...props
}) => {
	const t = useTranslation();

	return (
		<GenericModal
			{...props}
			variant='warning'
			icon={<Icon name='modal-warning' size={24} color='warning' />}
			cancelText={rooms?.length > 0 ? t('Back') : t('Cancel')}
			confirmText={t('Convert')}
			title={t('Confirmation')}
			onClose={onClose}
			onCancel={onCancel}
			onConfirm={(): void => onConfirm(deletedRooms)}
		>
			{t('You_are_converting_team_to_channel')}
		</GenericModal>
	);
};

export default SecondStep;
