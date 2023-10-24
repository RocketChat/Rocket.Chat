import { Button, ButtonGroup, Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';
import type { FC } from 'react';

import GenericMenu from '../../../../components/GenericMenu/GenericMenu';
import useDeactivateUserAction from '../hooks/useDeactivateUserAction';
import useDismissUserAction from '../hooks/useDismissUserAction';
import useResetAvatarAction from '../hooks/useResetAvatarAction';

const UserContextFooter: FC<{ userId: string; deleted: boolean }> = ({ userId, deleted }) => {
	const t = useTranslation();

	const dismissUserAction = useDismissUserAction(userId, true);
	const deactivateUserAction = useDeactivateUserAction(userId, true);

	return (
		<ButtonGroup width='full' stretch>
			<Button onClick={dismissUserAction.onClick} title={t('Moderation_Dismiss_all_reports')} aria-label={t('Moderation_Dismiss_reports')}>
				{t('Moderation_Dismiss_all_reports')}
			</Button>
			<Button
				disabled={deleted}
				onClick={deactivateUserAction.onClick}
				title={t('Deactivate')}
				aria-label={t('Moderation_Deactivate_User')}
				secondary
				danger
			>
				{t('Moderation_Deactivate_User')}
			</Button>
			<Box display='flex' flexGrow={0}>
				<GenericMenu large title={t('More')} items={[{ ...useResetAvatarAction(userId), disabled: deleted }]} placement='top-end' />
			</Box>
		</ButtonGroup>
	);
};

export default UserContextFooter;
