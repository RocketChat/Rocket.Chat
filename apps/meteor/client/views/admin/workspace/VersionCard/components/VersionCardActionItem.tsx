import { Box } from '@rocket.chat/fuselage';
import type { Keys } from '@rocket.chat/icons';
import { FramedIcon } from '@rocket.chat/ui-client';
import type { ReactElement, ReactNode } from 'react';
import React from 'react';

export type VersionActionItem = {
	type: 'danger' | 'neutral';
	icon: Keys;
	label: ReactNode;
};

type VersionCardActionItemProps = {
	actionItem: VersionActionItem;
};

const VersionCardActionItem = ({ actionItem }: VersionCardActionItemProps): ReactElement => {
	return (
		<Box display='flex' alignItems='center' color={actionItem.type === 'danger' ? 'danger' : 'secondary-info'} fontScale='p2m'>
			<FramedIcon type={actionItem.type} icon={actionItem.icon} />
			<Box mis={12}>{actionItem.label}</Box>
		</Box>
	);
};

export default VersionCardActionItem;
