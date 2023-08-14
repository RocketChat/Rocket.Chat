import { Box } from '@rocket.chat/fuselage';
import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React, { useCallback } from 'react';

import { GenericTableRow, GenericTableCell } from '../../../../components/GenericTable';
import UserAvatar from '../../../../components/avatar/UserAvatar';
import RemoveAgentButton from './RemoveAgentButton';

const AgentsTableRow = ({
	user: { _id, name, username, avatarETag, emails, statusLivechat, departments },
	mediaQuery,
	reload,
}: {
	user: {
		_id: string;
		name?: string;
		username?: string;
		avatarETag?: string;
		emails?: { address: string }[];
		statusLivechat: string;
		departments: string[];
	};
	mediaQuery: boolean;
	reload: () => void;
}): ReactElement => {
	const t = useTranslation();
	const agentsRoute = useRoute('omnichannel-agents');
	const queryClient = useQueryClient();

	const onRowClick = useCallback(() => {
		agentsRoute.push({
			context: 'info',
			id: _id,
		});
	}, [_id, agentsRoute]);

	const onAgentRemoved = useCallback(() => {
		departments.forEach((departmentId) => {
			queryClient.removeQueries(['/v1/livechat/department/:_id', departmentId]);
		});
	}, [queryClient, departments]);

	return (
		<GenericTableRow action onClick={onRowClick}>
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
			<RemoveAgentButton _id={_id} reload={reload} onAgentRemoved={onAgentRemoved} />
		</GenericTableRow>
	);
};

export default AgentsTableRow;
