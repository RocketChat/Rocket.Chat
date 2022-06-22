import { Emitter } from '@rocket.chat/emitter';
import { Random } from 'meteor/random';
import type { ReactNode } from 'react';

type BlazePortalEntry = {
	key: string;
	node: ReactNode;
};

class BlazePortalsSubscriptions extends Emitter<{ update: void }> {
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

export const blazePortals = new BlazePortalsSubscriptions();
