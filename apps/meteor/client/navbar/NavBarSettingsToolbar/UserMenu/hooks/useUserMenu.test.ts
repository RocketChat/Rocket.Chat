import { after, before, describe, it, mock } from 'node:test';

import { UIActionButtonContext } from '@rocket.chat/apps-engine/definition/ui';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';
import { expect } from 'expect';
import { fn } from 'jest-mock';
import type { FunctionLike } from 'jest-mock';

import { enterModuleScope, leaveModuleScope } from '../../../../../tests/mocks/moduleScope';

let useUserMenu: (typeof import('./useUserMenu'))['useUserMenu'];

const fakeUser = {
	_id: 'john.doe',
	username: 'john.doe',
	name: 'John Doe',
	createdAt: new Date(),
	active: true,
	_updatedAt: new Date(),
	roles: ['admin'],
	type: 'user' as const,
};

describe('useUserMenu', () => {
	before(() => {
		enterModuleScope();
		mock.module('../../../../lib/userStatuses', {
			exports: {
				userStatuses: {
					watch: fn<FunctionLike>(() => () => undefined),
					sync: fn<FunctionLike>(() => Promise.resolve()),
				},
			},
		});
		({ useUserMenu } = require('./useUserMenu'));
	});

	after(leaveModuleScope);

	it('should return one action from the server with no conditions', async () => {
		const { result } = renderHook(() => useUserMenu(fakeUser), {
			wrapper: mockAppRoot()
				.withEndpoint('GET', '/apps/actionButtons', () => [
					{
						appId: 'APP_ID',
						actionId: 'ACTION_ID',
						labelI18n: 'LABEL_I18N',
						context: UIActionButtonContext.USER_DROPDOWN_ACTION,
					},
				])
				.build(),
		});

		await waitFor(() => {
			const appsGroup = result.current.find((group) => group.title === 'Apps');
			expect(appsGroup).toBeDefined();
			expect(appsGroup?.items).toContainEqual(expect.objectContaining({ id: 'APP_ID_ACTION_ID' }));
		});
	});

	describe('user menu with role conditions', () => {
		it('should return the action if the user has admin role', async () => {
			const { result } = renderHook(() => useUserMenu(fakeUser), {
				wrapper: mockAppRoot()
					.withJohnDoe()
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
					.withRole('admin')
					.build(),
			});

			await waitFor(() => {
				const appsGroup = result.current.find((group) => group.title === 'Apps');
				expect(appsGroup).toBeDefined();
				expect(appsGroup?.items).toContainEqual(expect.objectContaining({ id: 'APP_ID_ACTION_ID' }));
			});
		});

		it('should filter out the action if the user does not have admin role', async () => {
			const { result } = renderHook(() => useUserMenu(fakeUser), {
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
					.build(),
			});

			await waitFor(() => {
				const appsGroup = result.current.find((group) => group.title === 'Apps');
				expect(appsGroup).not.toBeDefined();
			});
		});
	});

	describe('user menu with permission conditions', () => {
		it('should return the action if the user has manage-apps permission', async () => {
			const { result } = renderHook(() => useUserMenu(fakeUser), {
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
					.withPermission('manage-apps')
					.build(),
			});

			await waitFor(() => {
				const appsGroup = result.current.find((group) => group.title === 'Apps');
				expect(appsGroup).toBeDefined();
				expect(appsGroup?.items).toContainEqual(expect.objectContaining({ id: 'APP_ID_ACTION_ID' }));
			});
		});

		it('should filter out the action if the user does not have any permission', async () => {
			const { result } = renderHook(() => useUserMenu(fakeUser), {
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
					.build(),
			});

			await waitFor(() => {
				const appsGroup = result.current.find((group) => group.title === 'Apps');
				expect(appsGroup).not.toBeDefined();
			});
		});
	});
});
