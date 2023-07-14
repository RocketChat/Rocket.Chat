/* eslint-disable react/display-name, react/no-multi-comp */
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { ButtonGroup, IconButton } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement, Ref } from 'react';
import React, { forwardRef, useMemo } from 'react';

import GenericMenu from '../../../../components/GenericMenu/GenericMenu';
import UserInfo from '../../../../components/UserInfo';
import { useUserInfoActions } from '../../hooks/useUserInfoActions';

type UserInfoActionsProps = {
	user: Pick<IUser, '_id' | 'username'>;
	rid: IRoom['_id'];
	backToList: () => void;
};

const CustomMenuButton = forwardRef((props, ref: Ref<HTMLElement>) => (
	<IconButton ref={ref} {...props} icon='kebab' secondary small={false} />
));

const UserInfoActions = ({ user, rid, backToList }: UserInfoActionsProps): ReactElement => {
	const t = useTranslation();
	const { actions: actionsDefinition, menuActions: menuOptions } = useUserInfoActions(
		{ _id: user._id, username: user.username },
		rid,
		backToList,
	);

	const menu = useMemo(() => {
		if (!menuOptions) {
			return null;
		}

		return (
			<GenericMenu
				is={CustomMenuButton}
				title={t('More')}
				key='UserUserInfo-menu'
				data-qa-id='UserUserInfo-menu'
				sections={menuOptions}
				placement='bottom-end'
			/>
		);
	}, [menuOptions, t]);

	// TODO: sanitize Action type to avoid any
	const actions = useMemo(() => {
		const mapAction = ([key, { content, icon, onClick }]: any): ReactElement => (
			<UserInfo.Action key={key} title={content} label={content} onClick={onClick} icon={icon} />
		);

		return [...actionsDefinition.map(mapAction), menu].filter(Boolean);
	}, [actionsDefinition, menu]);

	return (
		<ButtonGroup mi='neg-x4' flexShrink={0} flexWrap='nowrap' withTruncatedText justifyContent='center'>
			{actions}
		</ButtonGroup>
	);
};

export default UserInfoActions;
