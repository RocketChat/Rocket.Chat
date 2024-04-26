import { Button, ButtonGroup, Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';
import type { FC } from 'react';

import GenericMenu from '../../../components/GenericMenu/GenericMenu';
import useDeactivateUserAction from './hooks/useDeactivateUserAction';
import useDeleteMessagesAction from './hooks/useDeleteMessagesAction';
import useDismissUserAction from './hooks/useDismissUserAction';
import useResetAvatarAction from './hooks/useResetAvatarAction';

const MessageContextFooter: FC<{ userId: string; deleted: boolean }> = ({ userId, deleted }) => {
	const t = useTranslation();

	const dismissUserAction = useDismissUserAction(userId);
	const deleteMessagesAction = useDeleteMessagesAction(userId);

	return (
		<ButtonGroup stretch>
			<Button onClick={dismissUserAction.onClick}>{t('Moderation_Dismiss_all_reports')}</Button>
			<Button onClick={deleteMessagesAction.onClick} secondary danger>
				{t('Moderation_Delete_all_messages')}
			</Button>

			<Box flexGrow={0} marginInlineStart={8}>
				<GenericMenu
					large
					title={t('More')}
					items={[
						{ ...useDeactivateUserAction(userId), ...(deleted && { disabled: true }) },
						{ ...useResetAvatarAction(userId), ...(deleted && { disabled: true }) },
					]}
					placement='top-end'
				/>
			</Box>
		</ButtonGroup>
	);
};

export default MessageContextFooter;
