import type { IRoom } from '@rocket.chat/core-typings';
import { PositionAnimated, AnimatedVisibility } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetting, useRolesDescription, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement, UIEvent } from 'react';
import React, { useMemo, useRef } from 'react';

import { getUserDisplayName } from '../../../../lib/getUserDisplayName';
import { Backdrop } from '../../../components/Backdrop';
import GenericMenu from '../../../components/GenericMenu/GenericMenu';
import LocalTime from '../../../components/LocalTime';
import UserCard from '../../../components/UserCard';
import { ReactiveUserStatus } from '../../../components/UserStatus';
import { useUserInfoQuery } from '../../../hooks/useUserInfoQuery';
import { useUserInfoActions } from '../hooks/useUserInfoActions';

type UserCardWithDataProps = {
	username: string;
	target: Element;
	rid: IRoom['_id'];
	open: (e: UIEvent) => void;
	onClose: () => void;
};

const UserCardWithData = ({ username, target, rid, open, onClose }: UserCardWithDataProps): ReactElement => {
	const t = useTranslation();
	const ref = useRef(target);
	const getRoles = useRolesDescription();
	const showRealNames = Boolean(useSetting('UI_Use_Real_Name'));

	const { data, isLoading } = useUserInfoQuery({ username });
	const getIsUserMuted = useEndpoint('GET', '/v1/users.isMuted');
	const { data: isUserMuted } = useQuery(['users.isMuted', username, rid], () => getIsUserMuted({ username, roomId: rid }));

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
			roles: roles && getRoles(roles).map((role, index) => <UserCard.Role key={index}>{role}</UserCard.Role>),
			bio,
			etag: avatarETag,
			localTime: utcOffset && Number.isInteger(utcOffset) && <LocalTime utcOffset={utcOffset} />,
			status: _id && <ReactiveUserStatus uid={_id} />,
			customStatus: statusText,
			nickname,
		};
	}, [data, username, showRealNames, isLoading, getRoles]);

	const handleOpen = useMutableCallback((e: UIEvent) => {
		open?.(e);
		onClose?.();
	});

	const { actions: actionsDefinition, menuActions: menuOptions } = useUserInfoActions(
		{ _id: user._id ?? '', username: user.username, name: user.name, isMuted: isUserMuted?.isMuted },
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
			<UserCard.Action key={key} label={content} aria-label={content} onClick={onClick} icon={icon} />
		);

		return [...actionsDefinition.map(mapAction), menu].filter(Boolean);
	}, [actionsDefinition, menu]);

	return (
		<>
			<Backdrop bg='transparent' onClick={onClose} />
			<PositionAnimated anchor={ref} placement='top-start' margin={8} visible={AnimatedVisibility.UNHIDING}>
				<UserCard {...user} onClose={onClose} open={handleOpen} actions={actions} isLoading={isLoading} />
			</PositionAnimated>
		</>
	);
};

export default UserCardWithData;
