/* eslint-disable react/display-name, react/no-multi-comp */
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { ButtonGroup, IconButton } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useMemo } from 'react';

import GenericMenu from '../../../../components/GenericMenu/GenericMenu';
import UserInfo from '../../../../components/UserInfo';
import { useUserInfoActions } from '../../hooks/useUserInfoActions';

type UserInfoActionsProps = {
	user: Pick<IUser, '_id' | 'username' | 'name' | 'freeSwitchExtension'>;
	rid: IRoom['_id'];
	backToList: () => void;
};

const UserInfoActions = ({ user, rid, backToList }: UserInfoActionsProps): ReactElement => {
	const t = useTranslation();
	const { _id: userId, username, name, freeSwitchExtension } = user;
	const { actions: actionsDefinition, menuActions: menuOptions } = useUserInfoActions({
		rid,
		user: { _id: userId, username, name, freeSwitchExtension },
		reload: backToList,
		size: 3,
	});

	const menu = useMemo(() => {
		if (!menuOptions?.length) {
			return null;
		}

		return (
			<GenericMenu
				button={<IconButton icon='kebab' secondary />}
				title={t('More')}
				key='menu'
				data-qa-id='UserUserInfo-menu'
				sections={menuOptions}
				placement='bottom-end'
				small={false}
				data-qa='UserUserInfo-menu'
			/>
		);
	}, [menuOptions, t]);

	// TODO: sanitize Action type to avoid any
	const actions = useMemo(() => {
		const mapAction = ([key, { content, icon, iconOnly, onClick }]: any): ReactElement => (
			<UserInfo.Action key={key} iconOnly={iconOnly} title={content} label={content} onClick={onClick} icon={icon} />
		);

		return [...actionsDefinition.map(mapAction), menu].filter(Boolean);
	}, [actionsDefinition, menu]);

	return <ButtonGroup align='center'>{actions}</ButtonGroup>;
};

export default UserInfoActions;
