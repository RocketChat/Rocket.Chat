import type { IRoom } from '@rocket.chat/core-typings';
import { PositionAnimated, AnimatedVisibility } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetting, useRolesDescription, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useMemo, useRef } from 'react';

import { getUserDisplayName } from '../../../../lib/getUserDisplayName';
import { Backdrop } from '../../../components/Backdrop';
import GenericMenu from '../../../components/GenericMenu/GenericMenu';
import LocalTime from '../../../components/LocalTime';
import { UserCard, UserCardAction, UserCardRole, UserCardSkeleton } from '../../../components/UserCard';
import { ReactiveUserStatus } from '../../../components/UserStatus';
import { useUserInfoQuery } from '../../../hooks/useUserInfoQuery';
import { useUserInfoActions } from '../hooks/useUserInfoActions';

type UserCardWithDataProps = {
	username: string;
	target: Element;
	rid: IRoom['_id'];
	onOpenUserInfo: () => void;
	onClose: () => void;
};

const UserCardWithData = ({ username, target, rid, onOpenUserInfo, onClose }: UserCardWithDataProps) => {
	const t = useTranslation();
	const ref = useRef(target);
	const getRoles = useRolesDescription();
	const showRealNames = Boolean(useSetting('UI_Use_Real_Name'));

	const { data, isLoading } = useUserInfoQuery({ username });

	ref.current = target;

	const user = useMemo(() => {
		const defaultValue = isLoading ? undefined : null;

		const {
			_id,
			name,
			roles = defaultValue,
			statusText = defaultValue,
			bio = defaultValue,
			utcOffset = defaultValue,
			nickname,
			avatarETag,
		} = data?.user || {};

		return {
			_id,
			name: getUserDisplayName(name, username, showRealNames),
			username,
			roles: roles && getRoles(roles).map((role, index) => <UserCardRole key={index}>{role}</UserCardRole>),
			bio,
			etag: avatarETag,
			localTime: utcOffset && Number.isInteger(utcOffset) && <LocalTime utcOffset={utcOffset} />,
			status: _id && <ReactiveUserStatus uid={_id} />,
			customStatus: statusText,
			nickname,
		};
	}, [data, username, showRealNames, isLoading, getRoles]);

	const handleOpenUserInfo = useMutableCallback(() => {
		onOpenUserInfo();
		onClose();
	});

	const { actions: actionsDefinition, menuActions: menuOptions } = useUserInfoActions(
		{ _id: user._id ?? '', username: user.username, name: user.name },
		rid,
	);

	const menu = useMemo(() => {
		if (!menuOptions?.length) {
			return null;
		}

		return <GenericMenu title={t('More')} key='menu' data-qa-id='menu' sections={menuOptions} placement='bottom-start' />;
	}, [menuOptions, t]);

	const actions = useMemo(() => {
		const mapAction = ([key, { content, icon, onClick }]: any): ReactElement => (
			<UserCardAction key={key} label={content} aria-label={content} onClick={onClick} icon={icon} />
		);

		return [...actionsDefinition.map(mapAction), menu].filter(Boolean);
	}, [actionsDefinition, menu]);

	return (
		<>
			<Backdrop bg='transparent' onClick={onClose} />
			<PositionAnimated anchor={ref} placement='top-start' margin={8} visible={AnimatedVisibility.UNHIDING}>
				{isLoading ? <UserCardSkeleton /> : <UserCard {...user} onClose={onClose} onOpenUserInfo={handleOpenUserInfo} actions={actions} />}
			</PositionAnimated>
		</>
	);
};

export default UserCardWithData;
