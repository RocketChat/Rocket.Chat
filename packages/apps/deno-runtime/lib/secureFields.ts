import type { App } from '@rocket.chat/apps-engine/definition/App';
import { AppObjectRegistry } from '../AppObjectRegistry.ts';

export type DataObjectWithSecureFields = {
	'@secureFields': {
		permission: string,
		name: string,
		value: unknown;
	}[],
	[key: string]: unknown,
}

export function applySecureFields(object: DataObjectWithSecureFields) {
	const { '@secureFields': secureFields, ...rest } = object;

	const app = AppObjectRegistry.get<App>('app');

	if (!app) {
		throw new Error("App unavailable, can't parse object with secure fields");
	}

	secureFields.forEach(({ permission, name, value }) => {
		if (app.getInfo().permissions?.findIndex((p) => p.name === permission) === -1) {
			return;
		}

		Object.defineProperty(rest, name, { value });
	});

	return rest;
}
