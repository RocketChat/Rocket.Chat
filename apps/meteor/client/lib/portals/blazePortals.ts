import { Emitter } from '@rocket.chat/emitter';
import type { Blaze } from 'meteor/blaze';
import { Random } from 'meteor/random';
import type { ReactNode } from 'react';
import { createElement, Fragment, useState } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

type BlazePortalEntry = {
	key: string;
	node: ReactNode;
};

export class BlazePortalsSubscription extends Emitter<{ update: void }> {
	private map = new Map<Blaze.TemplateInstance, BlazePortalEntry>();

	private cache = Array.from(this.map.values());

	getSnapshot = (): BlazePortalEntry[] => this.cache;

	subscribe = (onStoreChange: () => void): (() => void) => this.on('update', onStoreChange);

	register = (template: Blaze.TemplateInstance, node: ReactNode): void => {
		const entry = this.map.get(template);

		if (!entry) {
			this.map.set(template, { key: Random.id(), node });
			this.cache = Array.from(this.map.values());
			this.emit('update');
			return;
		}

		if (entry.node === node) {
			return;
		}

		this.map.set(template, { ...entry, node });
		this.cache = Array.from(this.map.values());
		this.emit('update');
	};

	unregister = (template: Blaze.TemplateInstance): void => {
		if (this.map.delete(template)) {
			this.cache = Array.from(this.map.values());
			this.emit('update');
		}
	};
}

export const blazePortals = new BlazePortalsSubscription();

export const getClosestBlazePortals = (view: Blaze.View | undefined): BlazePortalsSubscription => {
	if (!view) {
		return blazePortals;
	}

	if (typeof view.templateInstance !== 'function') {
		return getClosestBlazePortals(view.parentView);
	}

	const templateInstance = view.templateInstance() as Blaze.TemplateInstance<{
		portalsSubscription?: () => BlazePortalsSubscription;
	}>;

	if (!templateInstance) {
		return getClosestBlazePortals(view.parentView);
	}

	const subscription = templateInstance.data?.portalsSubscription?.();

	if (!(subscription instanceof BlazePortalsSubscription)) {
		return getClosestBlazePortals(view.parentView);
	}

	return subscription;
};

export const useBlazePortals = (
	outerSubscription: BlazePortalsSubscription | (() => BlazePortalsSubscription) = () => new BlazePortalsSubscription(),
) => {
	const [subscription] = useState(outerSubscription);
	const entries = useSyncExternalStore(subscription.subscribe, subscription.getSnapshot);

	const portals = createElement(Fragment, { children: entries.map(({ key, node }) => createElement(Fragment, { key, children: node })) });

	return [portals, subscription] as const;
};
