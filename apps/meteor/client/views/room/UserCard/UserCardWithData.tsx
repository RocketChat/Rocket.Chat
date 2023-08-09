import type { IRoom } from '@rocket.chat/core-typings';
import { PositionAnimated, AnimatedVisibility, Menu, Option } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetting, useRolesDescription } from '@rocket.chat/ui-contexts';
import type { ReactElement, UIEvent } from 'react';
import React, { useMemo, useRef } from 'react';

import { getUserDisplayName } from '../../../../lib/getUserDisplayName';
import { Backdrop } from '../../../components/Backdrop';
import LocalTime from '../../../components/LocalTime';
import UserCard from '../../../components/UserCard';
import { ReactiveUserStatus } from '../../../components/UserStatus';
import { useUserInfoQuery } from '../../../hooks/useUserInfoQuery';
import { useActionSpread } from '../../hooks/useActionSpread';
import { useUserInfoActions } from '../hooks/useUserInfoActions';

type UserCardWithDataProps = {
	username: string;
	target: Element;
	rid: IRoom['_id'];
	open: (e: UIEvent) => void;
	onClose: () => void;
};

const UserCardWithData = ({ username, target, rid, open, onClose }: UserCardWithDataProps): ReactElement => {
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

	const userActions = useUserInfoActions({ _id: user._id ?? '', username: user.username }, rid);
	const { actions: actionsDefinition, menu: menuOptions } = useActionSpread(userActions);

	const menu = useMemo(() => {
		if (!menuOptions) {
			return null;
		}

		return (
			<Menu
				flexShrink={0}
				maxHeight='initial'
				mi={2}
				key='menu'
				renderItem={({ label: { label, icon }, ...props }): ReactElement => <Option {...props} label={label} icon={icon} />}
				options={menuOptions}
			/>
		);
	}, [menuOptions]);

	const actions = useMemo(() => {
		const mapAction = ([key, { label, icon, action }]: any): ReactElement => (
			<UserCard.Action key={key} label={label} aria-label={label} onClick={action} icon={icon} />
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
