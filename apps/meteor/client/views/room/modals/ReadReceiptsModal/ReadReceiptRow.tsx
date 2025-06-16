import type { ReadReceipt } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useUserDisplayName } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';

import { useFormatDateAndTime } from '../../../../hooks/useFormatDateAndTime';

const ReadReceiptRow = ({ user, ts }: ReadReceipt): ReactElement => {
	const displayName = useUserDisplayName(user || {});
	const formatDateAndTime = useFormatDateAndTime({ withSeconds: true });

	return (
		<Box role='listitem' display='flex' flexDirection='row' justifyContent='space-between' alignItems='center' mbe={8}>
			<Box>
				<UserAvatar username={user?.username || ''} size='x24' />
				<Box is='span' mis={8}>
					{displayName}
				</Box>
			</Box>
			<Box is='span' fontScale='c1' color='hint'>
				{formatDateAndTime(ts)}
			</Box>
		</Box>
	);
};

export default ReadReceiptRow;
