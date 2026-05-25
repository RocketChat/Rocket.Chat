import { processActions } from './layoutEngine';

describe('RoomToolbox Layout Engine (processActions)', () => {
	it('should isolate featured items into featuredActions', () => {
		const actionsBase = [{ id: 'thread' }, { id: 'start-call' }];
		const config = {
			maxVisibleNormal: 6,
			items: [
				{ id: 'thread', featured: false, order: 10 },
				{ id: 'start-call', featured: true, order: 5 },
			],
		};
		const result = processActions(actionsBase, config);
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
		const result = processActions(actionsBase, config);
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
		const result = processActions(actionsBase, config);
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
		const result = processActions(actionsBase, config);
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
		const result = processActions(actionsBase, config);
		expect(result.visibleActions.length).toBeGreaterThan(0);
	});
});
