import { Box, BoxProps } from '@rocket.chat/fuselage';
import React, { FC, ReactNode } from 'react';

import { useTranslation } from '../../contexts/TranslationContext';
import UserStatus from '../UserStatus';

type UserNameProps = {
	status?: ReactNode;
	name?: string;
	username?: string;
	nickname?: string;
} & Omit<BoxProps, 'name'>;

const UserName: FC<UserNameProps> = ({
	status,
	name,
	username,
	nickname,
	...props
}) => {
	const t = useTranslation();

	return <Box
		{...props}
		display='flex'
		flexGrow={1}
		flexShrink={0}
		alignItems='center'
		fontScale='s2'
		color='default'
		overflow='hidden'
	>
		{status ?? <UserStatus.Offline />}
		<Box
			marginInline={8}
			title={username !== name ? username : undefined}
			withTruncatedText
		>
			{name}
		</Box>
		{nickname && <Box
			title={t('Nickname')}
			color='hint'
			fontScale='p1'
			withTruncatedText
		>
				({ nickname })
		</Box>}
	</Box>;
};

export default UserName;
