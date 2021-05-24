import { Skeleton } from '@rocket.chat/fuselage';
import React, { FC, ComponentProps } from 'react';

import GenericModal from '../../../../../components/GenericModal';
import { useTranslation } from '../../../../../contexts/TranslationContext';

type DeleteTeamSkeletonProps = Pick<ComponentProps<typeof GenericModal>, 'onClose'>;

const DeleteTeamSkeleton: FC<DeleteTeamSkeletonProps> = ({ onClose }) => {
	const t = useTranslation();
	return (
		<GenericModal
			title={t('Teams_about_the_channels')}
			confirmText={t('Cancel')}
			onConfirm={onClose}
			onClose={onClose}
		>
			<Skeleton variant='rect' height='x300' width='100%' />
		</GenericModal>
	);
};

export default DeleteTeamSkeleton;
