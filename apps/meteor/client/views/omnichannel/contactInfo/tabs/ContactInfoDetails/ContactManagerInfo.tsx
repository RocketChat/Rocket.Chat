import { Box, Skeleton } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { UserStatus } from '../../../../../components/UserStatus';

type ContactManagerInfoProps = { userId: string };

const ContactManagerInfo = ({ userId }: ContactManagerInfoProps) => {
	const { t } = useTranslation();

	const getContactManagerByUsername = useEndpoint('GET', '/v1/users.info');
	const { data, isLoading, isSuccess, isError } = useQuery({
		queryKey: ['getContactManagerByUserId', userId],
		queryFn: async () => getContactManagerByUsername({ userId }),
	});

	if (isError) {
		return null;
	}

	return (
		<Box>
			<Box mbe={4}>{t('Contact_Manager')}</Box>
			{isLoading && <Skeleton />}
			{isSuccess && (
				<Box display='flex' alignItems='center'>
					{data.user.username && <UserAvatar size='x18' username={data.user.username} />}
					<Box mi={8}>
						<UserStatus status={data.user.status} />
					</Box>
					<Box fontScale='p2'>{data.user.name}</Box>
				</Box>
			)}
		</Box>
	);
};

export default ContactManagerInfo;
