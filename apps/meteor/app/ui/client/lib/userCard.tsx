import type { ComponentProps } from 'react';
import React, { Suspense, createElement, lazy } from 'react';
import { createPortal } from 'react-dom';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { registerPortal } from '../../../../client/lib/portals/portalsSubscription';
import { queueMicrotask } from '../../../../client/lib/utils/queueMicrotask';

const UserCard = lazy(() => import('../../../../client/views/room/UserCard'));

type UserCardProps = ComponentProps<typeof UserCard>;

let props: UserCardProps;

const subscribers = new Set<() => void>();

const updateProps = (newProps: Partial<UserCardProps>) => {
	props = { ...props, ...newProps };
	subscribers.forEach((subscriber) => subscriber());
};

const getProps = () => props;

const subscribeToProps = (callback: () => void) => {
	subscribers.add(callback);

	return () => {
		subscribers.delete(callback);
	};
};

const UserCardWithProps = () => {
	const props = useSyncExternalStore(subscribeToProps, getProps);

	return (
		<Suspense fallback={null}>
			<UserCard {...props} />
		</Suspense>
	);
};

const createContainer = () => {
	const container = document.createElement('div');
	container.id = 'react-user-card';
	document.body.appendChild(container);

	return container;
};

let container: HTMLDivElement | undefined;
let unregisterPortal: (() => void) | undefined;

export const closeUserCard = () => {
	queueMicrotask(() => {
		if (unregisterPortal) {
			unregisterPortal();
			unregisterPortal = undefined;
		}
	});
};

export const openUserCard = (params: Omit<UserCardProps, 'onClose'>) => {
	updateProps({ ...params, onClose: closeUserCard });

	if (!container) {
		container = createContainer();
	}

	if (!unregisterPortal) {
		const children = createElement(UserCardWithProps);
		const portal = <>{createPortal(children, container)}</>;
		unregisterPortal = registerPortal(container, portal);
	}

	return closeUserCard;
};
