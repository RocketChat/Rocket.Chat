import { Box, IconButton } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useRouter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { GenericTableRow, GenericTableCell } from '../../../../components/GenericTable';
import { useRemoveAgent } from '../hooks/useRemoveAgent';

const AgentsTableRow = ({
	user: { _id, name, username, avatarETag, emails, statusLivechat },
	mediaQuery,
}: {
	user: {
		_id: string;
		name?: string;
		username?: string;
		avatarETag?: string;
		emails?: { address: string }[];
		statusLivechat: string;
	};
	mediaQuery: boolean;
}): ReactElement => {
	const { t } = useTranslation();
	const router = useRouter();

	const handleDelete = useRemoveAgent(_id);

	return (
		<GenericTableRow data-qa-id={username} action onClick={() => router.navigate(`/omnichannel/agents/info/${_id}`)}>
			<GenericTableCell>
				<Box display='flex' alignItems='center'>
					{username && <UserAvatar size={mediaQuery ? 'x28' : 'x40'} title={username} username={username} etag={avatarETag} />}
					<Box display='flex' withTruncatedText mi={8}>
						<Box display='flex' flexDirection='column' alignSelf='center' withTruncatedText>
							<Box fontScale='p2m' withTruncatedText color='default'>
								{name || username}
							</Box>
							{!mediaQuery && name && (
								<Box fontScale='p2' color='hint' withTruncatedText>
									{`@${username}`}
								</Box>
							)}
						</Box>
					</Box>
				</Box>
			</GenericTableCell>
			{mediaQuery && (
				<GenericTableCell>
					<Box fontScale='p2m' withTruncatedText color='hint'>
						{username}
					</Box>
					<Box mi={4} />
				</GenericTableCell>
			)}
			<GenericTableCell withTruncatedText>{emails?.length && emails[0].address}</GenericTableCell>
			<GenericTableCell withTruncatedText>{statusLivechat === 'available' ? t('Available') : t('Not_Available')}</GenericTableCell>
			<GenericTableCell withTruncatedText>
				<IconButton
					icon='trash'
					small
					title={t('Remove')}
					onClick={(e) => {
						e.stopPropagation();
						handleDelete();
					}}
				/>
			</GenericTableCell>
		</GenericTableRow>
	);
};

export default AgentsTableRow;
