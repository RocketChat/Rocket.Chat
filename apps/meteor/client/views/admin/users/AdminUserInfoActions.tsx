import { ButtonGroup, IconButton } from '@rocket.chat/fuselage';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { AdminUserInfoActionsProps } from './hooks/useAdminUserInfoActions';
import { useAdminUserInfoActions } from './hooks/useAdminUserInfoActions';
import { UserInfoAction } from '../../../components/UserInfo';

const AdminUserInfoActions = ({
	username,
	userId,
	isFederatedUser,
	isActive,
	isAdmin,
	tab,
	onChange,
	onReload,
}: AdminUserInfoActionsProps): ReactElement => {
	const { t } = useTranslation();
	const { actions: actionsDefinition, menuActions: menuOptions } = useAdminUserInfoActions({
		username,
		userId,
		isFederatedUser,
		isActive,
		isAdmin,
		tab,
		onChange,
		onReload,
	});

	const menu = useMemo(() => {
		if (!menuOptions) {
			return null;
		}

		return (
			<GenericMenu
				key='menu'
				button={<IconButton icon='kebab' secondary />}
				title={t('More')}
				sections={menuOptions}
				placement='bottom-end'
				small={false}
			/>
		);
	}, [t, menuOptions]);

	// TODO: sanitize Action type to avoid any
	const actions = useMemo(() => {
		const mapAction = ([key, { content, title, icon, onClick, disabled }]: any): ReactElement => (
			<UserInfoAction key={key} title={title} label={content} onClick={onClick} disabled={disabled} icon={icon} />
		);
		return [...actionsDefinition.map(mapAction), menu].filter(Boolean);
	}, [actionsDefinition, menu]);

	return (
		<ButtonGroup align='center' data-qa-id='UserInfoActions'>
			{actions}
		</ButtonGroup>
	);
};

export default AdminUserInfoActions;
