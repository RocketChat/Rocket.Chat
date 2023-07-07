import type { IRoom } from '@rocket.chat/core-typings';
import { PositionAnimated, AnimatedVisibility } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetting, useRolesDescription, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement, UIEvent } from 'react';
import React, { useMemo, useRef } from 'react';

import { getUserDisplayName } from '../../../../lib/getUserDisplayName';
import { Backdrop } from '../../../components/Backdrop';
import GenericMenu from '../../../components/GenericMenu/GenericMenu';
import type { GenericMenuItemProps } from '../../../components/GenericMenu/GenericMenuItem';
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

type MenuActionProps = {
	key: React.ReactNode;
	id: string;
	title: string;
	items: {
		id: string;
		key: React.ReactNode;
		content: React.ReactNode;
		icon: string | undefined;
		onClick: () => void;
		type: string | undefined;
	}[];
}[];

const UserCardWithData = ({ username, target, rid, open, onClose }: UserCardWithDataProps): ReactElement => {
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

	const menuActions =
		menuOptions !== undefined &&
		Object.values(menuOptions)
			.map((item) => ({
				id: item.label.label as string,
				key: item.label.label,
				content: item.label.label,
				icon: item.label.icon,
				onClick: item.action,
				type: item.type,
			}))
			.reduce((acc, item) => {
				const group = item.type ? item.type : '';
				const section = acc.find((section: { id: string }) => section.id === group);
				if (section) {
					section.items.push(item);
					return acc;
				}

				const newSection = { key: item.key, id: group, title: '', items: [item] };
				acc.push(newSection);

				return acc;
			}, [] as MenuActionProps);

	const menu = useMemo(() => {
		if (!menuActions) {
			return null;
		}

		return <GenericMenu title={t('More')} key='menu' data-qa-id='menu' sections={menuActions} placement='bottom-start' />;
	}, [menuActions, t]);

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
