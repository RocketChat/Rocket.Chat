import { Box, IconButton, Text } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { GenericTableRow, GenericTableCell } from '@rocket.chat/ui-client';
import { useRouter } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

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
}) => {
	const { t } = useTranslation();
	const router = useRouter();

	const handleDelete = useRemoveAgent(_id);

	return (
		<GenericTableRow action onClick={() => router.navigate(`/omnichannel/agents/info/${_id}`)}>
			<GenericTableCell>
				<Box display='flex' alignItems='center'>
					{username && <UserAvatar size={mediaQuery ? 'x28' : 'x40'} title={username} username={username} etag={avatarETag} />}
					<Box display='flex' withTruncatedText marginInline={8}>
						<Box display='flex' flexDirection='column' alignSelf='center' withTruncatedText>
							<Text fontScale='p2m' truncate color='default'>
								{name || username}
							</Text>
							{!mediaQuery && name && (
								<Text fontScale='p2' color='hint' truncate>
									{`@${username}`}
								</Text>
							)}
						</Box>
					</Box>
				</Box>
			</GenericTableCell>
			{mediaQuery && (
				<GenericTableCell>
					<Text fontScale='p2m' truncate color='hint'>
						{username}
					</Text>
					<Box marginInline={4} />
				</GenericTableCell>
			)}
			<GenericTableCell truncate>{emails?.length && emails[0].address}</GenericTableCell>
			<GenericTableCell truncate>{statusLivechat === 'available' ? t('Available') : t('Not_Available')}</GenericTableCell>
			<GenericTableCell truncate>
				<IconButton
					icon='trash'
					size='small'
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
