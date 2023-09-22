import { Skeleton } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import React from 'react';

import GenericModal from './GenericModal';

const GenericModalSkeleton = ({ onClose, ...props }: ComponentProps<typeof GenericModal>) => {
	const t = useTranslation();

	return (
		<GenericModal
			{...props}
			variant='warning'
			onClose={onClose}
			title={<Skeleton width='50%' />}
			confirmText={t('Cancel')}
			onConfirm={onClose}
		>
			<Skeleton width='full' />
		</GenericModal>
	);
};

export default GenericModalSkeleton;
