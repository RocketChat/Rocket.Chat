import { Button, ButtonGroup, Box } from '@rocket.chat/fuselage';
import { GenericMenu } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import useDeactivateUserAction from '../hooks/useDeactivateUserAction';
import useDismissUserAction from '../hooks/useDismissUserAction';
import useResetAvatarAction from '../hooks/useResetAvatarAction';

type UserContextFooterProps = { userId: string; deleted: boolean };

const UserContextFooter = ({ userId, deleted }: UserContextFooterProps) => {
	const { t } = useTranslation();

	const dismissUserAction = useDismissUserAction(userId, true);
	const deactivateUserAction = useDeactivateUserAction(userId, true);

	return (
		<ButtonGroup stretch>
			<Button onClick={dismissUserAction.onClick}>{t('Moderation_Dismiss_all_reports')}</Button>
			<Button disabled={deleted} onClick={deactivateUserAction.onClick} secondary danger>
				{t('Moderation_Deactivate_User')}
			</Button>
			<Box display='flex' flexGrow={0} marginInlineStart={8}>
				<GenericMenu large title={t('More')} items={[{ ...useResetAvatarAction(userId), disabled: deleted }]} placement='top-end' />
			</Box>
		</ButtonGroup>
	);
};

export default UserContextFooter;
