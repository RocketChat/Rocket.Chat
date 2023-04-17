import type { ComponentProps } from 'react';
import React, { Suspense, createElement, lazy } from 'react';
import { createPortal } from 'react-dom';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { registerPortal } from '../../../../client/lib/portals/portalsSubscription';
import { queueMicrotask } from '../../../../client/lib/utils/queueMicrotask';

const EmojiPicker = lazy(() => import('../../../../client/views/composer/EmojiPicker'));

type EmojiPickerProps = ComponentProps<typeof EmojiPicker>;

let props: EmojiPickerProps;

const subscribers = new Set<() => void>();

const updateProps = (newProps: Partial<EmojiPickerProps>) => {
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

const EmojiPickerWithProps = () => {
	const props = useSyncExternalStore(subscribeToProps, getProps);

	return (
		<Suspense fallback={null}>
			<EmojiPicker {...props} />
		</Suspense>
	);
};

const createContainer = () => {
	const container = document.createElement('div');
	container.id = 'react-emoji-picker';
	document.body.appendChild(container);

	return container;
};

let container: HTMLDivElement | undefined;
let unregisterPortal: (() => void) | undefined;

export const closeEmojiPicker = () => {
	queueMicrotask(() => {
		if (unregisterPortal) {
			unregisterPortal();
			unregisterPortal = undefined;
		}
	});
};

export const openEmojiPicker = (params: EmojiPickerProps) => {
	updateProps({ ...params, onClose: closeEmojiPicker });

	if (!container) {
		container = createContainer();
	}

	if (!unregisterPortal) {
		const children = createElement(EmojiPickerWithProps);
		const portal = createPortal(children, container);
		unregisterPortal = registerPortal(container, portal);
	}

	return close;
};
