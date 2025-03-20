import { Button, ButtonGroup, Box } from '@rocket.chat/fuselage';
import { GenericMenu } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import useDeactivateUserAction from './hooks/useDeactivateUserAction';
import useDeleteMessagesAction from './hooks/useDeleteMessagesAction';
import useDismissUserAction from './hooks/useDismissUserAction';
import useResetAvatarAction from './hooks/useResetAvatarAction';

type MessageContextFooterProps = { userId: string; deleted: boolean };

const MessageContextFooter = ({ userId, deleted }: MessageContextFooterProps) => {
	const { t } = useTranslation();

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
