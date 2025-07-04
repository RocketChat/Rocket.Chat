import { Skeleton } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

import GenericModal from './GenericModal';

const GenericModalSkeleton = (props: ComponentProps<typeof GenericModal>) => (
	<GenericModal {...props} icon={null} title={<Skeleton width='50%' />}>
		<Skeleton width='full' />
	</GenericModal>
);

export default GenericModalSkeleton;
