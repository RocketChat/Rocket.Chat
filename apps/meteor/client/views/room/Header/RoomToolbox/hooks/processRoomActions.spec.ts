import { processRoomActions } from './processRoomActions';
import type { RoomToolboxLayoutConfig } from './processRoomActions';

describe('RoomToolbox Layout Engine (processRoomActions)', () => {
	it('should isolate featured items into featuredActions', () => {
		const actionsBase = [{ id: 'thread' }, { id: 'start-call' }];
		const config = {
			maxVisibleNormal: 6,
			items: [
				{ id: 'thread', featured: false, order: 10 },
				{ id: 'start-call', featured: true, order: 5 },
			],
		};
		const result = processRoomActions(actionsBase, config);
		expect(result.featuredActions.map((a) => a.id)).toEqual(['start-call']);
	});
	it('should respect maxVisibleNormal limit and sort items by order', () => {
		const actionsBase = [{ id: 'thread' }, { id: 'clean-history' }, { id: 'team-info' }, { id: 'members-list' }];
		const config = {
			maxVisibleNormal: 2,
			items: [
				{ id: 'thread', featured: false, order: 10 },
				{ id: 'clean-history', featured: false, order: 250 },
				{ id: 'team-info', featured: false, order: 1 },
				{ id: 'members-list', featured: false, order: 7 },
			],
		};
		const result = processRoomActions(actionsBase, config);
		expect(result.visibleActions.map((a) => a.id)).toEqual(['team-info', 'members-list']);
		const hiddenIds = result.hiddenActions.flatMap((section) => section.items.map((i) => i.id));
		expect(hiddenIds).toContain('thread');
		expect(hiddenIds).toContain('clean-history');
	});
	it('should force app actions into hiddenActions grouped by section, ignoring config placement', () => {
		const actionsBase = [{ id: 'app-star-actions', type: 'apps' }];
		const config = {
			maxVisibleNormal: 6,
			items: [{ id: 'app-star-actions', featured: false, order: 1 }],
		};
		const result = processRoomActions(actionsBase, config);
		expect(result.visibleActions).toHaveLength(0);
		expect(result.hiddenActions).toMatchObject([
			{
				id: 'apps',
				items: [{ id: 'app-star-actions' }],
			},
		]);
	});
	it('should safely handle new/unknown actions not present in the layout config without dropping them', () => {
		const actionsBase = [{ id: 'legacy-action' }, { id: 'brand-new-action' }];
		const config = {
			maxVisibleNormal: 6,
			items: [{ id: 'legacy-action', featured: false, order: 1 }],
		};
		const result = processRoomActions(actionsBase, config);
		const allRenderedIds = [
			...result.featuredActions.map((a) => a.id),
			...result.visibleActions.map((a) => a.id),
			...result.hiddenActions.flatMap((section) => section.items.map((i) => i.id)),
		];
		expect(allRenderedIds).toContain('brand-new-action');
	});
	it('should safely fall back to legacy ordering if the provided layout config is invalid or empty', () => {
		const actionsBase = [{ id: 'thread' }, { id: 'start-call' }];
		const config = null;
		const result = processRoomActions(actionsBase, config);
		expect(result.visibleActions.length).toBeGreaterThan(0);
	});
	it('should return base actions unchanged when the config has no items', () => {
		const actionsBase = [{ id: 'thread' }, { id: 'start-call' }];
		const config = {
			items: [],
		};
		const result = processRoomActions(actionsBase, config);
		expect(result).toEqual({
			featuredActions: [],
			visibleActions: actionsBase,
			hiddenActions: [],
		});
	});
	it('should return base actions unchanged when items is missing from the config object', () => {
		const actionsBase = [{ id: 'thread' }, { id: 'start-call' }];
		const config: RoomToolboxLayoutConfig = {};
		const result = processRoomActions(actionsBase, config);
		expect(result).toEqual({
			featuredActions: [],
			visibleActions: actionsBase,
			hiddenActions: [],
		});
	});
	it('should fall back to default maxVisibleNormal (6) when not specified in config', () => {
		const actionsBase = [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }, { id: '5' }, { id: '6' }, { id: '7' }];
		const config = {
			items: [
				{ id: '1', featured: false, order: 1 },
				{ id: '2', featured: false, order: 2 },
				{ id: '3', featured: false, order: 3 },
				{ id: '4', featured: false, order: 4 },
				{ id: '5', featured: false, order: 5 },
				{ id: '6', featured: false, order: 6 },
				{ id: '7', featured: false, order: 7 },
			],
		};
		const result = processRoomActions(actionsBase, config);
		expect(result.visibleActions).toHaveLength(6);
		const hiddenIds = result.hiddenActions.flatMap((section) => section.items.map((i) => i.id));
		expect(hiddenIds).toEqual(['7']);
	});
	it('should force app actions into hiddenActions even when config is null', () => {
		const actionsBase = [{ id: 'app-x', type: 'apps' }, { id: 'thread' }];
		const result = processRoomActions(actionsBase, null);
		expect(result.visibleActions.map((a) => a.id)).toEqual(['thread']);
		expect(result.hiddenActions).toMatchObject([{ id: 'apps', items: [{ id: 'app-x' }] }]);
	});
	it('should sort featuredActions by order when multiple featured items exist', () => {
		const actionsBase = [{ id: 'start-call' }, { id: 'thread' }, { id: 'search' }];
		const config = {
			maxVisibleNormal: 6,
			items: [
				{ id: 'start-call', featured: true, order: 20 },
				{ id: 'thread', featured: true, order: 5 },
				{ id: 'search', featured: false, order: 10 },
			],
		};
		const result = processRoomActions(actionsBase, config);
		expect(result.featuredActions.map((a) => a.id)).toEqual(['thread', 'start-call']);
	});
	it('should treat negative maxVisibleNormal as 0, hiding all normal actions', () => {
		const actionsBase = [{ id: 'thread' }, { id: 'search' }];
		const config = {
			maxVisibleNormal: -3,
			items: [
				{ id: 'thread', featured: false, order: 1 },
				{ id: 'search', featured: false, order: 2 },
			],
		};
		const result = processRoomActions(actionsBase, config);
		expect(result.visibleActions).toHaveLength(0);
		const hiddenIds = result.hiddenActions.flatMap((section) => section.items.map((i) => i.id));
		expect(hiddenIds).toEqual(['thread', 'search']);
	});
});
