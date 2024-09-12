/* eslint-disable react/display-name, react/no-multi-comp */
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { ButtonGroup, IconButton, Skeleton } from '@rocket.chat/fuselage';
import { GenericMenu } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useMemo } from 'react';

import { UserInfoAction } from '../../../../components/UserInfo';
import { useMemberExists } from '../../../hooks/useMemberExists';
import { useUserInfoActions } from '../../hooks/useUserInfoActions';

type UserInfoActionsProps = {
	user: Pick<IUser, '_id' | 'username' | 'name'>;
	rid: IRoom['_id'];
	backToList: () => void;
};

const UserInfoActions = ({ user, rid, backToList }: UserInfoActionsProps): ReactElement => {
	const t = useTranslation();
	const {
		data: isMemberData,
		refetch,
		isSuccess: membershipCheckSuccess,
		isLoading,
	} = useMemberExists({ roomId: rid, username: user.username as string });

	const isMember = membershipCheckSuccess && isMemberData?.isMember;

	const { actions: actionsDefinition, menuActions: menuOptions } = useUserInfoActions(
		{ _id: user._id, username: user.username, name: user.name },
		rid,
		() => {
			backToList?.();
			refetch();
		},
		undefined,
		isMember,
	);

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
		const mapAction = ([key, { content, icon, onClick }]: any): ReactElement => (
			<UserInfoAction key={key} title={content} label={content} onClick={onClick} icon={icon} />
		);

		return [...actionsDefinition.map(mapAction), menu].filter(Boolean);
	}, [actionsDefinition, menu]);

	if (isLoading) {
		return <Skeleton w='full' />;
	}
	return <ButtonGroup align='center'>{actions}</ButtonGroup>;
};

export default UserInfoActions;
