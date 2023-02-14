import { Box } from '@rocket.chat/fuselage';
import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback } from 'react';

import { GenericTableRow, GenericTableCell } from '../../../components/GenericTable';
import UserAvatar from '../../../components/avatar/UserAvatar';
import RemoveAgentButton from './RemoveAgentButton';

const AgentsPageRow = ({
	user: { _id, name, username, avatarETag, emails, statusLivechat },
	mediaQuery,
	reload,
}: {
	user: { _id: string; name?: string; username?: string; avatarETag?: string; emails?: { address: string }[]; statusLivechat: string };
	mediaQuery: boolean;
	reload: () => void;
}): ReactElement => {
	const t = useTranslation();
	const agentsRoute = useRoute('omnichannel-agents');

	const onRowClick = useCallback(() => {
		agentsRoute.push({
			context: 'info',
			id: _id,
		});
	}, [_id, agentsRoute]);

	return (
		<GenericTableRow action onClick={onRowClick}>
			<GenericTableCell>
				<Box display='flex' alignItems='center'>
					{username && <UserAvatar size={mediaQuery ? 'x28' : 'x40'} title={username} username={username} etag={avatarETag} />}
					<Box display='flex' withTruncatedText mi='x8'>
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
					<Box mi='x4' />
				</GenericTableCell>
			)}
			<GenericTableCell withTruncatedText>{emails?.length && emails[0].address}</GenericTableCell>
			<GenericTableCell withTruncatedText>{statusLivechat === 'available' ? t('Available') : t('Not_Available')}</GenericTableCell>
			<RemoveAgentButton _id={_id} reload={reload} />
		</GenericTableRow>
	);
};

export default AgentsPageRow;
