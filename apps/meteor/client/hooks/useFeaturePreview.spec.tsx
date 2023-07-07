/* eslint-disable react/no-multi-comp */
import type { ISetting } from '@rocket.chat/core-typings';
import type { LoginService } from '@rocket.chat/ui-contexts';
import { SettingsContext, UserContext } from '@rocket.chat/ui-contexts';
import { renderHook } from '@testing-library/react-hooks';
import type { ObjectId } from 'mongodb';
import type { ContextType } from 'react';
import React from 'react';

import { useFeaturePreview } from './useFeaturePreview';

const userContextValue: ContextType<typeof UserContext> = {
	userId: 'john.doe',
	user: {
		_id: 'john.doe',
		username: 'john.doe',
		name: 'John Doe',
		createdAt: new Date(),
		active: true,
		_updatedAt: new Date(),
		roles: ['admin'],
		type: 'user',
	},
	queryPreference: <T,>(pref: string | ObjectId, defaultValue: T) => [
		() => () => undefined,
		() => (typeof pref === 'string' ? undefined : defaultValue),
	],
	querySubscriptions: () => [() => () => undefined, () => []],
	querySubscription: () => [() => () => undefined, () => undefined],
	queryRoom: () => [() => () => undefined, () => undefined],

	queryAllServices: () => [() => (): void => undefined, (): LoginService[] => []],
	loginWithService: () => () => Promise.reject('loginWithService not implemented'),
	loginWithPassword: async () => Promise.reject('loginWithPassword not implemented'),
	loginWithToken: async () => Promise.reject('loginWithToken not implemented'),
	logout: () => Promise.resolve(),
};

const settingContextValue: ContextType<typeof SettingsContext> = {
	hasPrivateAccess: true,
	isLoading: false,
	querySetting: (_id: string) => [() => () => undefined, () => undefined],
	querySettings: () => [() => () => undefined, () => []],
	dispatch: async () => undefined,
};

it('should return false if featurePreviewEnabled is false', () => {
	const { result } = renderHook(
		() => {
			return useFeaturePreview('quickReactions');
		},
		{
			wrapper: ({ children }) => (
				<MockedSettingsContext
					settings={{
						Accounts_AllowFeaturePreview: false,
					}}
				>
					<MockedUserContext userPreferences={{}}>{children}</MockedUserContext>
				</MockedSettingsContext>
			),
		},
	);

	expect(result.all[0]).toBe(false);
});

it('should return false if featurePreviewEnabled is true but feature is not in userPreferences', () => {
	const { result } = renderHook(
		() => {
			return useFeaturePreview('quickReactions');
		},
		{
			wrapper: ({ children }) => (
				<MockedSettingsContext
					settings={{
						Accounts_AllowFeaturePreview: false,
					}}
				>
					<MockedUserContext
						userPreferences={{
							featuresPreview: [
								{
									name: 'quickReactions',
									value: true,
								},
							],
						}}
					>
						{children}
					</MockedUserContext>
				</MockedSettingsContext>
			),
		},
	);

	expect(result.all[0]).toBe(false);
});

it('should return true if featurePreviewEnabled is true and feature is in userPreferences', () => {
	const { result } = renderHook(
		() => {
			return useFeaturePreview('quickReactions');
		},
		{
			wrapper: ({ children }) => (
				<MockedSettingsContext
					settings={{
						Accounts_AllowFeaturePreview: true,
					}}
				>
					<MockedUserContext
						userPreferences={{
							featuresPreview: [
								{
									name: 'quickReactions',
									value: true,
								},
							],
						}}
					>
						{children}
					</MockedUserContext>
				</MockedSettingsContext>
			),
		},
	);

	expect(result.all[0]).toBe(true);
});

const createUserContextValue = ({ userPreferences }: { userPreferences?: Record<string, unknown> }): ContextType<typeof UserContext> => {
	return {
		...userContextValue,
		...(userPreferences && { queryPreference: (id) => [() => () => undefined, () => userPreferences[id as unknown as string] as any] }),
	};
};

const createSettingContextValue = ({ settings }: { settings?: Record<string, ISetting['value']> }): ContextType<typeof SettingsContext> => {
	const cache = new Map<string, ISetting['value']>();

	return {
		...settingContextValue,
		...(settings && {
			querySetting: (_id: string) => [
				() => () => undefined,
				() => {
					if (cache.has(_id)) {
						return cache.get(_id) as any;
					}
					cache.set(_id, { value: settings[_id] } as any);
					return cache.get(_id) as any;
				},
			],
		}),
	};
};

export const MockedSettingsContext = ({
	settings,
	children,
}: {
	children: React.ReactNode;
	settings?: Record<string, ISetting['value']>;
}) => {
	return <SettingsContext.Provider value={createSettingContextValue({ settings })}>{children}</SettingsContext.Provider>;
};

export const MockedUserContext = ({
	userPreferences,
	children,
}: {
	children: React.ReactNode;
	userPreferences?: Record<string, unknown>;
}) => {
	return <UserContext.Provider value={createUserContextValue({ userPreferences })}>{children}</UserContext.Provider>;
};
