import type { ReadReceipt } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors';
import React, { ReactElement } from 'react';

import UserAvatar from '../../../../components/avatar/UserAvatar';
import { useFormatDateAndTime } from '../../../../hooks/useFormatDateAndTime';
import { useUserDisplayName } from '../../../../hooks/useUserDisplayName';

const hoverStyle = css`
	&:hover {
		background-color: ${colors.n400};
	}
`;

const ReadReceiptRow = ({ user, ts }: ReadReceipt): ReactElement => {
	const displayName = useUserDisplayName(user);
	const formatDateAndTime = useFormatDateAndTime({ withSeconds: true });

	return (
		<Box
			display='flex'
			flexDirection='row'
			justifyContent='space-between'
			alignItems='center'
			p='x4'
			pi='x32'
			mi='neg-x32'
			className={hoverStyle}
		>
			<Box>
				<UserAvatar username={user.username || ''} size='x24' />
				<Box is='span' mis='x8'>
					{displayName}
				</Box>
			</Box>
			<Box is='span' fontScale='c1' color='info'>
				{formatDateAndTime(ts)}
			</Box>
		</Box>
	);
};

export default ReadReceiptRow;
