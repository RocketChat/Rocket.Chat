/* eslint-disable react/display-name, react/no-multi-comp */
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { ButtonGroup, IconButton, Skeleton } from '@rocket.chat/fuselage';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { UserInfoAction } from '../../../../components/UserInfo';
import { useMemberExists } from '../../../hooks/useMemberExists';
import { useUserInfoActions } from '../../hooks/useUserInfoActions';

type UserInfoActionsProps = {
	user: Pick<IUser, '_id' | 'username' | 'name' | 'freeSwitchExtension'>;
	rid: IRoom['_id'];
	backToList?: () => void;
};

const UserInfoActions = ({ user, rid, backToList }: UserInfoActionsProps): ReactElement => {
	const { t } = useTranslation();
	const {
		data: isMemberData,
		refetch,
		isSuccess: membershipCheckSuccess,
		isPending,
	} = useMemberExists({ roomId: rid, username: user.username as string });

	const isMember = membershipCheckSuccess && isMemberData?.isMember;
	const { _id: userId, username, name, freeSwitchExtension } = user;

	const { actions: actionsDefinition, menuActions: menuOptions } = useUserInfoActions({
		rid,
		user: { _id: userId, username, name, freeSwitchExtension },
		size: 3,
		isMember,
		reload: () => {
			backToList?.();
			refetch();
		},
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
		const mapAction = ([key, { content, title, icon, onClick }]: any): ReactElement => (
			<UserInfoAction key={key} title={title} label={content} onClick={onClick} icon={icon} />
		);

		return [...actionsDefinition.map(mapAction), menu].filter(Boolean);
	}, [actionsDefinition, menu]);

	if (isPending) {
		return <Skeleton w='full' />;
	}
	return <ButtonGroup align='center'>{actions}</ButtonGroup>;
};

export default UserInfoActions;
