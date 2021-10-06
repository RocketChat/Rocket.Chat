import { Emitter } from '@rocket.chat/emitter';
import { Random } from 'meteor/random';
import type { ReactNode } from 'react';
import type { Subscription, Unsubscribe } from 'use-subscription';

type BlazePortalEntry = {
	key: string;
	node: ReactNode;
};

class BlazePortalsSubscriptions
	extends Emitter<{ update: void }>
	implements Subscription<BlazePortalEntry[]>
{
	private map = new Map<Blaze.TemplateInstance, BlazePortalEntry>();

	getCurrentValue = (): BlazePortalEntry[] => Array.from(this.map.values());

	subscribe = (callback: () => void): Unsubscribe => this.on('update', callback);

	register = (template: Blaze.TemplateInstance, node: ReactNode): void => {
		const entry = this.map.get(template);

		if (!entry) {
			this.map.set(template, { key: Random.id(), node });
			this.emit('update');
			return;
		}

		if (entry.node === node) {
			return;
		}

		this.map.set(template, { ...entry, node });
		this.emit('update');
	};

	unregister = (template: Blaze.TemplateInstance): void => {
		if (this.map.delete(template)) {
			this.emit('update');
		}
	};
}

export const blazePortals = new BlazePortalsSubscriptions();
