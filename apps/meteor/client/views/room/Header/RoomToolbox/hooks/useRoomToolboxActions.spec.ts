import { mockAppRoot } from '@rocket.chat/mock-providers';
import { LayoutContext } from '@rocket.chat/ui-contexts';
import type { LayoutContextValue, RoomToolboxActionConfig } from '@rocket.chat/ui-contexts';
import { renderHook } from '@testing-library/react';
import React from 'react';

import { useRoomToolboxActions } from './useRoomToolboxActions';

describe('useRoomToolboxActions', () => {
	it('should return an empty array if there are no actions', () => {
		const { result } = renderHook(() => useRoomToolboxActions({ actions: [], openTab: () => undefined }), {
			wrapper: mockAppRoot().build(),
		});
		expect(result.current.featuredActions).toEqual([]);
		expect(result.current.hiddenActions).toEqual([]);
		expect(result.current.visibleActions).toEqual([]);
	});

	it('should return apps actions only inside hiddenActions', () => {
		const { result } = renderHook(() => useRoomToolboxActions({ actions: appsActions, openTab: () => undefined }), {
			wrapper: mockAppRoot().build(),
		});
		const appsSection = result.current.hiddenActions[0];
		const appsItems = appsSection.items;

		expect(appsSection).toBeDefined();
		expect(appsSection).toHaveProperty('id', 'apps');
		expect(appsItems).toMatchObject(appsActions);
	});

	it('should return max of 6 items on visibleActions and the rest items inside hiddenActions', () => {
		const { result } = renderHook(() => useRoomToolboxActions({ actions, openTab: () => undefined }), {
			wrapper: mockAppRoot().build(),
		});
		expect(result.current.hiddenActions.length).toBeGreaterThan(0);
		expect(result.current.visibleActions.length).toBe(6);
	});

	it('should return featured items inside featuredActions', () => {
		const { result } = renderHook(() => useRoomToolboxActions({ actions, openTab: () => undefined }), {
			wrapper: mockAppRoot().build(),
		});
		expect(result.current.featuredActions).toMatchObject(actions.filter((action) => action.featured));
	});

	describe('with roomToolboxLayout feature preview enabled', () => {
		const mockLayoutConfig = JSON.stringify({
			maxVisibleNormal: 2,
			items: [
				{ id: 'team-info', featured: false, order: 1 },
				{ id: 'thread', featured: true, order: 10 },
				{ id: 'discussions', featured: false, order: 2 },
				{ id: 'rocket-search', featured: false, order: 3 },
			],
		});

		it('should respect custom featured and visible ordering', () => {
			const { result } = renderHook(() => useRoomToolboxActions({ actions, openTab: () => undefined }), {
				wrapper: mockAppRoot()
					.withSetting('Accounts_AllowFeaturePreview', true)
					.withUserPreference('featuresPreview', [{ name: 'roomToolboxLayout', value: true }])
					.withSetting('Room_Toolbox_Layout', mockLayoutConfig)
					.build(),
			});

			expect(result.current.featuredActions.map((a) => a.id)).toEqual(['thread']);

			expect(result.current.visibleActions.map((a) => a.id)).toEqual(['team-info', 'discussions']);

			const hiddenIds = result.current.hiddenActions.flatMap((s) => s.items.map((i) => i.id));
			expect(hiddenIds).toContain('rocket-search');
		});

		it('should fall back to legacy behavior if config is invalid JSON', () => {
			const { result } = renderHook(() => useRoomToolboxActions({ actions, openTab: () => undefined }), {
				wrapper: mockAppRoot()
					.withSetting('Accounts_AllowFeaturePreview', true)
					.withUserPreference('featuresPreview', [{ name: 'roomToolboxLayout', value: true }])
					.withSetting('Room_Toolbox_Layout', '{ invalid json }')
					.build(),
			});

			expect(result.current.featuredActions.map((a) => a.id)).toEqual(['start-call']);
			expect(result.current.visibleActions.length).toBe(6);
		});

		it('should fall back to legacy behavior if feature preview is disabled', () => {
			const { result } = renderHook(() => useRoomToolboxActions({ actions, openTab: () => undefined }), {
				wrapper: mockAppRoot()
					.withSetting('Accounts_AllowFeaturePreview', true)
					.withUserPreference('featuresPreview', [{ name: 'roomToolboxLayout', value: false }])
					.withSetting('Room_Toolbox_Layout', mockLayoutConfig)
					.build(),
			});

			expect(result.current.featuredActions.map((a) => a.id)).toEqual(['start-call']);
			expect(result.current.visibleActions.length).toBe(6);
		});

		it('should handle unexpanded layout properly (roomToolboxExpanded = false)', () => {
			const mockLayoutContextValue: LayoutContextValue = {
				isEmbedded: false,
				showTopNavbarEmbeddedLayout: false,
				isTablet: false,
				isMobile: false,
				roomToolboxExpanded: false,
				navbar: {
					searchExpanded: false,
				},
				sidebar: {
					overlayed: false,
					setOverlayed: () => undefined,
					isCollapsed: false,
					shouldToggle: false,
					toggle: () => undefined,
					collapse: () => undefined,
					expand: () => undefined,
					close: () => undefined,
				},
				sidePanel: {
					displaySidePanel: true,
					closeSidePanel: () => undefined,
					openSidePanel: () => undefined,
				},
				size: {
					sidebar: '240px',
					contextualBar: '380px',
				},
				contextualBarPosition: 'relative',
				contextualBarExpanded: false,
				hiddenActions: {
					roomToolbox: [],
					messageToolbox: [],
					composerToolbox: [],
					userToolbox: [],
				},
			};

			const { result } = renderHook(() => useRoomToolboxActions({ actions, openTab: () => undefined }), {
				wrapper: ({ children }) => {
					const Parent = mockAppRoot()
						.withSetting('Accounts_AllowFeaturePreview', true)
						.withUserPreference('featuresPreview', [{ name: 'roomToolboxLayout', value: true }])
						.withSetting('Room_Toolbox_Layout', mockLayoutConfig)
						.build();
					return React.createElement(
						Parent,
						null,
						React.createElement(LayoutContext.Provider, { value: mockLayoutContextValue }, children),
					);
				},
			});

			expect(result.current.featuredActions.map((a) => a.id)).toEqual(['thread']);

			expect(result.current.visibleActions).toEqual([]);

			const hiddenIds = result.current.hiddenActions.flatMap((s) => s.items.map((i) => i.id));
			expect(hiddenIds).toContain('team-info');
			expect(hiddenIds).toContain('discussions');
			expect(hiddenIds).toContain('rocket-search');
		});
	});
});

const appsActions: RoomToolboxActionConfig[] = [
	{
		id: 'app1',
		title: 'app-42212581-0966-44aa-8366-b3e92aa00df4.action_button_label_files',
		groups: ['group', 'channel', 'live', 'team', 'direct', 'direct_multiple'],
		type: 'apps',
		icon: undefined as unknown as RoomToolboxActionConfig['icon'],
	},
	{
		id: 'app2',
		title: 'app-42212581-0966-44aa-8366-b3e92aa00df4.action_button_label_files',
		groups: ['group', 'channel', 'live', 'team', 'direct', 'direct_multiple'],
		type: 'apps',
		icon: undefined as unknown as RoomToolboxActionConfig['icon'],
	},
];

const actions: RoomToolboxActionConfig[] = [
	{
		id: 'team-info',
		groups: ['team'],
		anonymous: true,
		full: true,
		title: 'Teams_Info',
		icon: 'info-circled',
		order: 1,
	},
	{
		id: 'thread',
		groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
		full: true,
		title: 'Threads',
		icon: 'thread',
		order: 2,
	},
	{
		id: 'team-channels',
		groups: ['team'],
		anonymous: true,
		full: true,
		title: 'Team_Channels',
		icon: 'hash',
		order: 2,
	},
	{
		id: 'discussions',
		groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
		title: 'Discussions',
		icon: 'discussion',
		full: true,
		order: 3,
	},
	{
		id: 'start-call',
		title: 'Call',
		icon: 'phone',
		groups: ['direct', 'direct_multiple', 'group', 'team', 'channel', 'direct'],
		disabled: false,
		full: true,
		order: 4,
		featured: true,
	},
	{
		id: 'rocket-search',
		groups: ['channel', 'group', 'direct', 'direct_multiple', 'live', 'team'],
		title: 'Search_Messages',
		icon: 'magnifier',
		order: 5,
	},
	{
		id: 'mentions',
		groups: ['channel', 'group', 'team'],
		title: 'Mentions',
		icon: 'at',
		order: 6,
		type: 'organization',
	},
	{
		id: 'members-list',
		groups: ['channel', 'group', 'team'],
		title: 'Teams_members',
		icon: 'members',
		order: 7,
	},
	{
		id: 'uploaded-files-list',
		groups: ['channel', 'group', 'direct', 'direct_multiple', 'live', 'team'],
		title: 'Files',
		icon: 'clip',
		order: 8,
		type: 'organization',
	},
	{
		id: 'pinned-messages',
		groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
		title: 'Pinned_Messages',
		icon: 'pin',
		order: 9,
		type: 'organization',
	},
	{
		id: 'starred-messages',
		groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
		title: 'Starred_Messages',
		icon: 'star',
		order: 10,
		type: 'organization',
	},
	{
		id: 'keyboard-shortcut-list',
		groups: ['channel', 'group', 'direct', 'direct_multiple', 'team'],
		title: 'Keyboard_Shortcuts_Title',
		icon: 'keyboard',
		order: 99,
		type: 'customization',
	},
	{
		id: 'clean-history',
		groups: ['channel', 'group', 'team', 'direct_multiple', 'direct'],
		full: true,
		title: 'Prune_Messages',
		icon: 'eraser',
		order: 250,
		type: 'customization',
	},
];
