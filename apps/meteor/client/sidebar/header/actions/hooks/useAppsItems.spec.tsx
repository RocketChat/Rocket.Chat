import { UIActionButtonContext } from '@rocket.chat/apps-engine/definition/ui';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import { useAppsItems } from './useAppsItems';

it('should return and empty array if the user does not have `manage-apps` and `access-marketplace` permission', () => {
	const { result } = renderHook(() => useAppsItems(), {
		wrapper: mockAppRoot()
			.withEndpoint('GET', '/apps/actionButtons', () => [])
			.build(),
	});

	expect(result.current).toEqual([]);
});

it('should return `marketplace` and `installed` items if the user has `access-marketplace` permission', () => {
	const { result } = renderHook(() => useAppsItems(), {
		wrapper: mockAppRoot()
			.withEndpoint('GET', '/apps/actionButtons', () => [])
			.withPermission('access-marketplace')
			.build(),
	});

	expect(result.current[0]).toEqual(
		expect.objectContaining({
			id: 'marketplace',
		}),
	);

	expect(result.current[1]).toEqual(
		expect.objectContaining({
			id: 'installed',
		}),
	);
});

it('should return `marketplace` and `installed` items if the user has `manage-apps` permission', () => {
	const { result } = renderHook(() => useAppsItems(), {
		wrapper: mockAppRoot()
			.withEndpoint('GET', '/apps/actionButtons', () => [])
			.withEndpoint('GET', '/apps/app-request/stats', () => ({
				data: {
					totalSeen: 0,
					totalUnseen: 1,
				},
			}))
			.withPermission('manage-apps')
			.build(),
	});

	expect(result.current[0]).toEqual(
		expect.objectContaining({
			id: 'marketplace',
		}),
	);

	expect(result.current[1]).toEqual(
		expect.objectContaining({
			id: 'installed',
		}),
	);

	expect(result.current[2]).toEqual(
		expect.objectContaining({
			id: 'requested-apps',
		}),
	);
});

it('should return one action from the server with no conditions', async () => {
	const { result } = renderHook(() => useAppsItems(), {
		wrapper: mockAppRoot()
			.withEndpoint('GET', '/apps/actionButtons', () => [
				{
					appId: 'APP_ID',
					actionId: 'ACTION_ID',
					labelI18n: 'LABEL_I18N',
					context: UIActionButtonContext.USER_DROPDOWN_ACTION,
				},
			])
			.withEndpoint('GET', '/apps/app-request/stats', () => ({
				data: {
					totalSeen: 0,
					totalUnseen: 1,
				},
			}))
			.withPermission('manage-apps')
			.build(),
	});

	expect(result.current[0]).toEqual(
		expect.objectContaining({
			id: 'marketplace',
		}),
	);

	expect(result.current[1]).toEqual(
		expect.objectContaining({
			id: 'installed',
		}),
	);

	await waitFor(() =>
		expect(result.current[3]).toEqual(
			expect.objectContaining({
				id: 'APP_ID_ACTION_ID',
			}),
		),
	);
});

describe('User Dropdown actions with role conditions', () => {
	it('should return the action if the user has admin role', async () => {
		const { result } = renderHook(() => useAppsItems(), {
			wrapper: mockAppRoot()
				.withEndpoint('GET', '/apps/actionButtons', () => [
					{
						appId: 'APP_ID',
						actionId: 'ACTION_ID',
						labelI18n: 'LABEL_I18N',
						context: UIActionButtonContext.USER_DROPDOWN_ACTION,
						when: {
							hasOneRole: ['admin'],
						},
					},
				])
				.withEndpoint('GET', '/apps/app-request/stats', () => ({
					data: {
						totalSeen: 0,
						totalUnseen: 1,
					},
				}))
				.withPermission('manage-apps')
				.withJohnDoe()
				.withRole('admin')
				.build(),
		});

		expect(result.current[0]).toEqual(
			expect.objectContaining({
				id: 'marketplace',
			}),
		);

		expect(result.current[1]).toEqual(
			expect.objectContaining({
				id: 'installed',
			}),
		);

		await waitFor(() =>
			expect(result.current[3]).toEqual(
				expect.objectContaining({
					id: 'APP_ID_ACTION_ID',
				}),
			),
		);
	});

	it('should return filter the action if the user doesn`t have admin role', async () => {
		const { result } = renderHook(() => useAppsItems(), {
			wrapper: mockAppRoot()
				.withEndpoint('GET', '/apps/actionButtons', () => [
					{
						appId: 'APP_ID',
						actionId: 'ACTION_ID',
						labelI18n: 'LABEL_I18N',
						context: UIActionButtonContext.USER_DROPDOWN_ACTION,
						when: {
							hasOneRole: ['admin'],
						},
					},
				])
				.withEndpoint('GET', '/apps/app-request/stats', () => ({
					data: {
						totalSeen: 0,
						totalUnseen: 1,
					},
				}))
				.withPermission('manage-apps')
				.build(),
		});

		expect(result.current[0]).toEqual(
			expect.objectContaining({
				id: 'marketplace',
			}),
		);

		expect(result.current[1]).toEqual(
			expect.objectContaining({
				id: 'installed',
			}),
		);

		expect(result.current[2]).toEqual(
			expect.objectContaining({
				id: 'requested-apps',
			}),
		);

		expect(result.current[3]).toEqual(undefined);
	});
});

describe('User Dropdown actions with permission conditions', () => {
	it('should return the action if the user has manage-apps permission', async () => {
		const { result } = renderHook(() => useAppsItems(), {
			wrapper: mockAppRoot()
				.withEndpoint('GET', '/apps/actionButtons', () => [
					{
						appId: 'APP_ID',
						actionId: 'ACTION_ID',
						labelI18n: 'LABEL_I18N',
						context: UIActionButtonContext.USER_DROPDOWN_ACTION,
						when: {
							hasOnePermission: ['manage-apps'],
						},
					},
				])
				.withEndpoint('GET', '/apps/app-request/stats', () => ({
					data: {
						totalSeen: 0,
						totalUnseen: 1,
					},
				}))
				.withPermission('manage-apps')
				.build(),
		});

		expect(result.current[0]).toEqual(
			expect.objectContaining({
				id: 'marketplace',
			}),
		);

		expect(result.current[1]).toEqual(
			expect.objectContaining({
				id: 'installed',
			}),
		);

		await waitFor(() =>
			expect(result.current[3]).toEqual(
				expect.objectContaining({
					id: 'APP_ID_ACTION_ID',
				}),
			),
		);
	});

	it('should return filter the action if the user doesn`t have `any` permission', async () => {
		const { result } = renderHook(() => useAppsItems(), {
			wrapper: mockAppRoot()
				.withEndpoint('GET', '/apps/actionButtons', () => [
					{
						appId: 'APP_ID',
						actionId: 'ACTION_ID',
						labelI18n: 'LABEL_I18N',
						context: UIActionButtonContext.USER_DROPDOWN_ACTION,
						when: {
							hasOnePermission: ['any'],
						},
					},
				])
				.withEndpoint('GET', '/apps/app-request/stats', () => ({
					data: {
						totalSeen: 0,
						totalUnseen: 1,
					},
				}))
				.withPermission('manage-apps')
				.build(),
		});

		expect(result.current[3]).toEqual(undefined);
	});
});
