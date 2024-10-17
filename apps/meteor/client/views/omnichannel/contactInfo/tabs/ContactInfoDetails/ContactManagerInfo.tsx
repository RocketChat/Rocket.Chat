import { Box } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import { UserStatus } from '../../../../../components/UserStatus';

type ContactManagerInfoProps = { userId: string };

const ContactManagerInfo = ({ userId }: ContactManagerInfoProps) => {
	const t = useTranslation();

	const getContactManagerByUsername = useEndpoint('GET', '/v1/users.info');
	const { data, isLoading } = useQuery(['getContactManagerByUserId', userId], async () => getContactManagerByUsername({ userId }));

	if (isLoading) {
		return null;
	}

	return (
		<Box>
			<Box mbe={4}>{t('Contact_Manager')}</Box>
			<Box display='flex' alignItems='center'>
				{data?.user.username && <UserAvatar size='x18' username={data.user.username} />}
				<Box mi={8}>
					<UserStatus status={data?.user.status} />
				</Box>
				<Box fontScale='p2'>{data?.user.name}</Box>
			</Box>
		</Box>
	);
};

export default ContactManagerInfo;
