import type { ComponentProps } from 'react';
import { createElement } from 'react';
import { createPortal } from 'react-dom';

import { registerPortal } from '../../../../client/lib/portals/portalsSubscription';
import { queueMicrotask } from '../../../../client/lib/utils/queueMicrotask';
import UserCardHolder from '../../../../client/views/room/UserCardHolder';

type UserCardProps = ReturnType<ComponentProps<typeof UserCardHolder>['getProps']>;

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
		const children = createElement(UserCardHolder, { getProps, subscribeToProps });
		const portal = createPortal(children, container);
		unregisterPortal = registerPortal(container, portal);
	}

	return closeUserCard;
};
