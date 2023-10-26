import { Button, ButtonGroup } from '@rocket.chat/fuselage';
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
		<ButtonGroup width='full' stretch>
			<Button onClick={dismissUserAction.onClick} title={t('Moderation_Dismiss_all_reports')} aria-label={t('Moderation_Dismiss_reports')}>
				{t('Moderation_Dismiss_all_reports')}
			</Button>
			<Button
				onClick={deleteMessagesAction.onClick}
				title={t('delete-message')}
				aria-label={t('Moderation_Delete_all_messages')}
				secondary
				danger
			>
				{t('Moderation_Delete_all_messages')}
			</Button>

			<GenericMenu
				title={t('More')}
				items={[
					{ ...useDeactivateUserAction(userId), ...(deleted && { disabled: true }) },
					{ ...useResetAvatarAction(userId), ...(deleted && { disabled: true }) },
				]}
				placement='top-end'
			/>
		</ButtonGroup>
	);
};

export default MessageContextFooter;
