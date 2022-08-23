import { IRoom } from '@rocket.chat/core-typings';
import { PositionAnimated, AnimatedVisibility, Menu, Option } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetting, useRolesDescription } from '@rocket.chat/ui-contexts';
import React, { useMemo, useRef, ReactElement } from 'react';

import { Backdrop } from '../../../components/Backdrop';
import LocalTime from '../../../components/LocalTime';
import UserCard from '../../../components/UserCard';
import { ReactiveUserStatus } from '../../../components/UserStatus';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { useActionSpread } from '../../hooks/useActionSpread';
import { useUserInfoActions } from '../hooks/useUserInfoActions';

type UserCardWithDataProps = {
	username: string;
	onClose: () => void;
	target: Element;
	open: (e: Event) => void;
	rid: IRoom['_id'];
};

const UserCardWithData = ({ username, onClose, target, open, rid }: UserCardWithDataProps): ReactElement => {
	const ref = useRef(target);
	const getRoles = useRolesDescription();
	const showRealNames = useSetting('UI_Use_Real_Name');

	const query = useMemo(() => ({ username }), [username]);
	const { value: data, phase: state } = useEndpointData('/v1/users.info', query);

	ref.current = target;

	const user = useMemo(() => {
		const loading = state === AsyncStatePhase.LOADING;
		const defaultValue = loading ? undefined : null;

		const {
			_id,
			name = username,
			roles = defaultValue,
			statusText = defaultValue,
			bio = defaultValue,
			utcOffset = defaultValue,
			nickname,
			avatarETag,
		} = data?.user || {};

		return {
			_id,
			name: showRealNames ? name : username,
			username,
			roles: roles && getRoles(roles).map((role, index) => <UserCard.Role key={index}>{role}</UserCard.Role>),
			bio,
			etag: avatarETag,
			localTime: utcOffset && Number.isInteger(utcOffset) && <LocalTime utcOffset={utcOffset} />,
			status: _id && <ReactiveUserStatus uid={_id} />,
			customStatus: statusText,
			nickname,
		};
	}, [data, username, showRealNames, state, getRoles]);

	const handleOpen = useMutableCallback((e) => {
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
				mi='x2'
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
				<UserCard {...user} onClose={onClose} open={handleOpen} actions={actions} />
			</PositionAnimated>
		</>
	);
};

export default UserCardWithData;
