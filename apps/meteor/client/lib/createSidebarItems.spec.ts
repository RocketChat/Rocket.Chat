import { createSidebarItems, isSidebarItem, isGoRocketChatLink } from './createSidebarItems';
import type { Item, SidebarDivider } from './createSidebarItems';

describe('createSidebarItems', () => {
	it('should initialize with provided items', () => {
		const initial: Item[] = [
			{ i18nLabel: 'Item1', href: '/path1' },
			{ i18nLabel: 'Item2', href: '/path2' },
		];
		const { getSidebarItems } = createSidebarItems(initial);
		expect(getSidebarItems()).toEqual(initial);
	});

	it('should initialize with empty array when no items provided', () => {
		const { getSidebarItems } = createSidebarItems();
		expect(getSidebarItems()).toEqual([]);
	});

	it('should register a new sidebar item and notify subscribers', () => {
		const { registerSidebarItem, getSidebarItems, subscribeToSidebarItems } = createSidebarItems();
		const listener = jest.fn();
		const unsubscribe = subscribeToSidebarItems(listener);

		const item: Item = { i18nLabel: 'NewItem', href: '/new' };
		registerSidebarItem(item);

		expect(getSidebarItems()).toEqual([item]);
		expect(listener).toHaveBeenCalledTimes(1);

		unsubscribe();
	});

	it('should produce a new array reference on registration for useSyncExternalStore', () => {
		const { registerSidebarItem, getSidebarItems } = createSidebarItems();
		const before = getSidebarItems();
		registerSidebarItem({ i18nLabel: 'NewItem', href: '/new' });
		const after = getSidebarItems();

		expect(before).not.toBe(after);
	});

	it('should unregister a sidebar item by i18nLabel and notify subscribers', () => {
		const item1: Item = { i18nLabel: 'Item1', href: '/path1' };
		const item2: Item = { i18nLabel: 'Item2', href: '/path2' };
		const { unregisterSidebarItem, getSidebarItems, subscribeToSidebarItems } = createSidebarItems([item1, item2]);
		const listener = jest.fn();
		subscribeToSidebarItems(listener);

		unregisterSidebarItem('Item1');

		expect(getSidebarItems()).toEqual([item2]);
		expect(listener).toHaveBeenCalledTimes(1);
	});

	it('should stop notifying after unsubscribing', () => {
		const { registerSidebarItem, subscribeToSidebarItems } = createSidebarItems();
		const listener = jest.fn();
		const unsubscribe = subscribeToSidebarItems(listener);

		unsubscribe();
		registerSidebarItem({ i18nLabel: 'Item', href: '/path' });

		expect(listener).not.toHaveBeenCalled();
	});

	describe('isSidebarItem', () => {
		it('should identify normal item as sidebar item', () => {
			const item: Item = { i18nLabel: 'Item', href: '/path' };
			expect(isSidebarItem(item)).toBe(true);
		});

		it('should identify divider as not a normal sidebar item', () => {
			const divider: SidebarDivider = { divider: true, i18nLabel: 'Divider' };
			expect(isSidebarItem(divider)).toBe(false);
		});
	});

	describe('isGoRocketChatLink', () => {
		it('should return true for go.rocket.chat links', () => {
			expect(isGoRocketChatLink('https://go.rocket.chat/i/test')).toBe(true);
		});

		it('should return false for regular relative paths', () => {
			expect(isGoRocketChatLink('/omnichannel/tags')).toBe(false);
		});
	});
});
