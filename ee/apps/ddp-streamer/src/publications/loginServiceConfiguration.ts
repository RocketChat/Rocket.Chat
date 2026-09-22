import { EventEmitter } from 'events';

import type { LoginServiceConfiguration } from '@rocket.chat/core-typings';

import type { Server } from '../Server';

const collection = 'meteor_accounts_loginServiceConfiguration';
const publication = 'meteor.loginServiceConfiguration';

const records = new Map<string, any>();
const events = new EventEmitter();

export function seedLoginServiceConfiguration(seed: LoginServiceConfiguration[]): void {
	seed.forEach((record) => records.set(record._id, record));
}

/** Keeps the mirrored login service configuration current and forwards the change to every active subscriber. */
export function updateLoginServiceConfiguration(action: 'added' | 'changed' | 'removed', record: Record<string, any>): void {
	if (action === 'removed') {
		records.delete(record._id);
	} else {
		records.set(record._id, record);
	}

	events.emit(publication, action, record);
}

export function registerLoginServiceConfigurationPublication(server: Server): void {
	server.publish(publication, async function () {
		records.forEach((record) => this.added(collection, record._id, record));

		const fn = (action: string, record: any): void => {
			switch (action) {
				case 'added':
				case 'changed':
					this[action](collection, record._id, record);
					break;
				case 'removed':
					this[action](collection, record._id);
			}
		};

		events.on(publication, fn);

		this.onStop(() => {
			events.removeListener(publication, fn);
		});

		this.ready();
	});
}
