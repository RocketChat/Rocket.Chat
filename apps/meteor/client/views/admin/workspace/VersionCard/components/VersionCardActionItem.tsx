import { Box, FramedIcon } from '@rocket.chat/fuselage';
import type { Keys } from '@rocket.chat/icons';
import type { ReactElement, ReactNode } from 'react';

export type VersionActionItem = {
	danger?: boolean;
	icon: Keys;
	label: ReactNode;
};

type VersionCardActionItemProps = VersionActionItem;

const VersionCardActionItem = ({ icon, label, danger }: VersionCardActionItemProps): ReactElement => {
	return (
		<Box display='flex' alignItems='center' color={danger ? 'danger' : 'secondary-info'} fontScale='p2m'>
			<FramedIcon danger={danger} icon={icon} />
			<Box mis={12}>{label}</Box>
		</Box>
	);
};

export default VersionCardActionItem;
