import type { UserStatus as UserStatusType } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { useSetting } from '@rocket.chat/ui-contexts';
import React from 'react';

import { UserStatus } from '../../components/UserStatus';

const UserAvatarStatus = ({ status }: { status: UserStatusType | 'online' | 'offline' }) => {
	const presenceDisabled = useSetting<boolean>('Presence_broadcast_disabled');

	return (
		<Box
			className={css`
				top: 0.5rem;
				right: 0.5rem;
			`}
			justifyContent='center'
			alignItems='center'
			display='flex'
			overflow='hidden'
			size='x12'
			borderWidth='default'
			position='relative'
			bg='surface-tint'
			borderColor='extra-light'
			borderRadius='full'
			mie='neg-x12'
			mbe='neg-x2'
		>
			<UserStatus small status={presenceDisabled ? 'disabled' : status} />
		</Box>
	);
};

export default UserAvatarStatus;
