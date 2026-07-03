import { assertEquals } from 'https://deno.land/std@0.203.0/assert/mod.ts';
import { describe, it } from 'https://deno.land/std@0.203.0/testing/bdd.ts';
import { spy } from 'https://deno.land/std@0.203.0/testing/mock.ts';

import * as Messenger from '../lib/messenger';

import { unhandledExceptionListener, unhandledRejectionListener } from '../error-handlers';

// the Deno seam suite: exercises the platform-specific error-handler
// registration and, in doing so, confirms the Deno adapter resolves the base
// source through the import map.
describe('error-handlers (Deno seam)', () => {
	it('forwards unhandled rejections to the base Messenger as a notification', () => {
		const enqueue = spy(Messenger.Queue, 'enqueue');

		try {
			const error = new Error('rejected');
			unhandledRejectionListener({ preventDefault() {}, reason: error } as unknown as PromiseRejectionEvent);

			assertEquals(enqueue.calls.length, 1);
			const notification = enqueue.calls[0].args[0] as { method: string; params: unknown[] };
			assertEquals(notification.method, 'unhandledRejection');
			assertEquals(notification.params, [error.stack]);
		} finally {
			enqueue.restore();
		}
	});

	it('forwards uncaught exceptions to the base Messenger as a notification', () => {
		const enqueue = spy(Messenger.Queue, 'enqueue');

		try {
			const error = new Error('thrown');
			unhandledExceptionListener({ preventDefault() {}, error } as unknown as ErrorEvent);

			assertEquals(enqueue.calls.length, 1);
			const notification = enqueue.calls[0].args[0] as { method: string; params: unknown[] };
			assertEquals(notification.method, 'uncaughtException');
			assertEquals(notification.params, [error.stack]);
		} finally {
			enqueue.restore();
		}
	});
});
