import { Meteor } from 'meteor/meteor';

import { SystemLogger } from '../../lib/logger/system';
import { settings } from '../../settings';

export function logMethodCallError(method: string, err: unknown): void {
	if ((err as any)?.isClientSafe || (err as any)?.meteorError) {
		SystemLogger.debug({ msg: 'Expected error while invoking method', err, method });
		return;
	}

	SystemLogger.error({ msg: 'Exception while invoking method', err, method });

	if (settings.get('Log_Level') === '2') {
		Meteor._debug(`Exception while invoking method ${method}`, err);
	}
}
