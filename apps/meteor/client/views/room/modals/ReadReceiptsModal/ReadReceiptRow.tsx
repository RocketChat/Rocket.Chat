import type { ReadReceipt } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';

import UserAvatar from '../../../../components/avatar/UserAvatar';
import { useFormatDateAndTime } from '../../../../hooks/useFormatDateAndTime';
import { useUserDisplayName } from '../../../../hooks/useUserDisplayName';

const hoverStyle = css`
	&:hover {
		background-color: ${Palette.surface['surface-neutral']};
	}
`;

const ReadReceiptRow = ({ user, ts }: ReadReceipt): ReactElement => {
	const displayName = useUserDisplayName(user || {});
	const formatDateAndTime = useFormatDateAndTime({ withSeconds: true });

	return (
		<Box
			display='flex'
			flexDirection='row'
			justifyContent='space-between'
			alignItems='center'
			p={4}
			pi={32}
			mi='neg-x32'
			className={hoverStyle}
		>
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
