import { SIDEBAR_CATEGORY_ACTIVITY_FILTER_MAX_HOURS } from '@rocket.chat/core-typings';
import type { ISidebarCategory } from '@rocket.chat/core-typings';

import { validateSidebarCategories } from './saveUserPreferences';

jest.mock('meteor/check', () => ({ Match: { Optional: jest.fn(), Integer: jest.fn() }, check: jest.fn() }), { virtual: true });
jest.mock('@rocket.chat/models', () => ({ Subscriptions: {}, Users: {} }));
jest.mock('../../lib/notifyListener', () => ({}));
jest.mock('../../lib/statusVisibility/resolveUsers', () => ({}));
jest.mock('../../lib/statusVisibility/settings', () => ({}));
jest.mock('../../settings', () => ({ settings: { get: jest.fn() } }));

const category = (overrides: Partial<ISidebarCategory> = {}): ISidebarCategory => ({ _id: 'cat-1', name: 'Design', ...overrides });

describe('validateSidebarCategories', () => {
	describe('activityFilterHours', () => {
		it.each([1, 24, 36, SIDEBAR_CATEGORY_ACTIVITY_FILTER_MAX_HOURS])('accepts %s hours', (activityFilterHours) => {
			const categories = [category({ activityFilterHours })];

			expect(() => validateSidebarCategories(categories)).not.toThrow();
			expect(categories[0].activityFilterHours).toBe(activityFilterHours);
		});

		it.each([0, -1, SIDEBAR_CATEGORY_ACTIVITY_FILTER_MAX_HOURS + 1])('rejects %s hours with a client-safe error', (activityFilterHours) => {
			expect(() => validateSidebarCategories([category({ activityFilterHours })])).toThrow(
				expect.objectContaining({ error: 'error-invalid-param' }),
			);
		});

		it('validates a default (system group) entry too', () => {
			expect(() => validateSidebarCategories([{ _id: 'Channels', name: 'Channels', default: true, activityFilterHours: 0 }])).toThrow(
				expect.objectContaining({ error: 'error-invalid-param' }),
			);
		});

		it('drops a null filter instead of storing it', () => {
			const categories = [category({ activityFilterHours: null as unknown as number })];

			validateSidebarCategories(categories);

			expect(categories[0]).not.toHaveProperty('activityFilterHours');
		});

		it('still validates the name of an entry whose filter is null or missing', () => {
			expect(() => validateSidebarCategories([category({ name: '   ', activityFilterHours: null as unknown as number })])).toThrow(
				expect.objectContaining({ error: 'error-invalid-param' }),
			);
			expect(() => validateSidebarCategories([category({ name: '   ' })])).toThrow(
				expect.objectContaining({ error: 'error-invalid-param' }),
			);
		});

		it('leaves an entry without a filter alone', () => {
			const categories = [category()];

			validateSidebarCategories(categories);

			expect(categories[0]).toEqual({ _id: 'cat-1', name: 'Design' });
		});
	});
});
