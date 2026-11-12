/* oxlint-disable react/no-multi-comp -- the reference menu is a fixture */
import type { Meta, StoryObj } from '@storybook/react';
import { useRef } from 'react';
import { mergeProps, useMenu, useMenuItem } from 'react-aria';
import { Item as AriaItem, useTreeState } from 'react-stately';
import { expect, fireEvent, fn, userEvent, waitFor, within } from 'storybook/test';

import { Menu, MenuItem, MenuItemContent, MenuItemDescription, MenuItemIcon, MenuItemInput, MenuSection, MenuSubmenuTrigger } from '.';
import { ariaSnapshot, classContract, expectForwards } from '../../testing/g0';
import { webRowHandlerKeys } from '../../types/ElementAttributes';

// G0 characterization of Menu on its develop implementation: the trigger, the react-aria popup, items, sections, submenus
// and the keyboard model. A rewrite passes these unedited, in jest and in the compiled zero-runtime Storybook; see
// src/testing/README.md. The popup renders in a portal, so the specs query `document.body`.
export default {
	title: 'Characterization/Menu',
	component: Menu,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof Menu>;

type Story = StoryObj<typeof Menu>;

// jsdom has no ResizeObserver, which the popover positioning reads, and no media queries, which pick the desktop popup
const stubResizeObserver = () => {
	window.ResizeObserver ??= class {
		observe = () => undefined;

		unobserve = () => undefined;

		disconnect = () => undefined;
	};
	window.matchMedia ??= (media: string) =>
		({ media, matches: true, addEventListener: () => undefined, removeEventListener: () => undefined }) as unknown as MediaQueryList;
};

const body = () => within(document.body);
const trigger = (canvas: HTMLElement) => within(canvas).getByRole('button');
const items = () => [...document.querySelectorAll<HTMLElement>('[role="menuitem"]')];
const popupItems = (label: string) => items().find((item) => item.textContent?.includes(label)) as HTMLElement;

const onAction = fn();

export const TriggerForwarding: Story = {
	render: () => (
		<Menu title='Actions' className='consumer-class' onAction={onAction}>
			<MenuItem key='one'>One</MenuItem>
			<MenuItem key='two'>Two</MenuItem>
		</Menu>
	),
	play: async ({ canvasElement }) => {
		stubResizeObserver();
		const button = trigger(canvasElement);
		await expectForwards(canvasElement, button, { className: 'consumer-class', title: 'Actions' });
		await expect(button).toHaveAttribute('aria-haspopup', 'true');
		await expect(button).toHaveAttribute('aria-expanded', 'false');
		await expect(button.tagName).toBe('BUTTON');

		await userEvent.click(button);
		await waitFor(() => expect(button).toHaveAttribute('aria-expanded', 'true'));
		await expect(await body().findByRole('menu')).toBeInTheDocument();
		await userEvent.click(button);
		await waitFor(() => expect(button).toHaveAttribute('aria-expanded', 'false'));
	},
};

export const AriaLabelOverTitle: Story = {
	render: () => (
		<Menu title='Title' aria-label='Label'>
			<MenuItem key='one'>One</MenuItem>
		</Menu>
	),
	play: async ({ canvasElement }) => {
		await expect(trigger(canvasElement)).toHaveAttribute('aria-label', 'Label');
	},
};

export const ItemsAndSelection: Story = {
	render: () => (
		<Menu title='Items' onAction={onAction} disabledKeys={['disabled']}>
			<MenuItem key='plain'>Plain</MenuItem>
			<MenuItem key='disabled'>Disabled</MenuItem>
			<MenuItem key='danger'>Danger</MenuItem>
		</Menu>
	),
	play: async ({ canvasElement }) => {
		stubResizeObserver();
		onAction.mockClear();
		await userEvent.click(trigger(canvasElement));
		await body().findByRole('menu');
		const [plain, disabled] = items();
		await expect(items()).toHaveLength(3);
		await expect(plain.tagName).toBe('LABEL');
		await expect(plain).toHaveClass('rcx-item', 'rcx-item--inset-md');
		await expect(disabled).toHaveAttribute('aria-disabled', 'true');
		await expect(disabled).toHaveClass('rcx-item--disabled');

		await userEvent.click(disabled);
		await expect(onAction).not.toHaveBeenCalled();
		await expect(items()).toHaveLength(3);

		await userEvent.click(plain);
		await expect(onAction).toHaveBeenCalledWith('plain');
		await waitFor(() => expect(items()).toHaveLength(0));
	},
};

export const RichItems: Story = {
	render: () => (
		<Menu title='Rich'>
			<MenuSection title='Status'>
				<MenuItem key='a' aria-label='Alpha'>
					<MenuItemIcon name='user' />
					<MenuItemContent>Alpha</MenuItemContent>
					<MenuItemInput>
						<input type='checkbox' aria-label='alpha check' />
					</MenuItemInput>
				</MenuItem>
				<MenuItem key='b'>Bravo</MenuItem>
			</MenuSection>
			<MenuSection>
				<MenuItem key='c'>Charlie</MenuItem>
			</MenuSection>
		</Menu>
	),
	play: async ({ canvasElement }) => {
		stubResizeObserver();
		await userEvent.click(trigger(canvasElement));
		await body().findByRole('menu');
		const group = await body().findByRole('group', { name: 'Status' });
		await expect(group).toBeInTheDocument();
		await expect(document.querySelector('.rcx-item-group-header')).toHaveTextContent('Status');
		await expect(document.querySelectorAll('.rcx-item-divider')).toHaveLength(1);
		await expect(document.querySelector('.rcx-item-divider')).toHaveAttribute('role', 'separator');
		await expect(popupItems('Alpha').querySelector('.rcx-option__column .rcx-option__icon')).not.toBeNull();
		await expect(popupItems('Alpha').querySelector('.rcx-option__content')).not.toBeNull();
		await expect(popupItems('Alpha').querySelector('.rcx-option__input')).not.toBeNull();
		await expect(popupItems('Bravo').querySelector('.rcx-item__content > .rcx-item__title')).toHaveTextContent('Bravo');
	},
};

export const Description: Story = {
	render: () => (
		<Menu title='Described'>
			<MenuItem key='a' textValue='With description'>
				<MenuItemContent>With description</MenuItemContent>
				<MenuItemDescription>Some detail</MenuItemDescription>
			</MenuItem>
			<MenuItem key='b'>Plain</MenuItem>
		</Menu>
	),
	play: async ({ canvasElement }) => {
		stubResizeObserver();
		await userEvent.click(trigger(canvasElement));
		await body().findByRole('menu');
		const described = popupItems('With description');
		await expect(described.querySelector('.rcx-option__description-block')).toHaveTextContent('Some detail');
		await expect(popupItems('Plain').querySelector('.rcx-option__description-block')).toBeNull();
	},
};

export const Keyboard: Story = {
	render: () => (
		<Menu title='Keyboard'>
			<MenuItem key='profile'>Profile</MenuItem>
			<MenuItem key='chats'>Chats</MenuItem>
			<MenuItem key='settings'>Settings</MenuItem>
		</Menu>
	),
	play: async ({ canvasElement }) => {
		stubResizeObserver();
		const user = userEvent.setup();
		trigger(canvasElement).focus();
		await user.keyboard('{Enter}');
		await waitFor(() => expect(items().length).toBeGreaterThan(1));
		await waitFor(() => expect(items()).toContain(document.activeElement));
		const first = document.activeElement;
		await user.keyboard('{ArrowDown}');
		await waitFor(() => expect(document.activeElement).not.toBe(first));
		await expect(items()).toContain(document.activeElement);
		await user.keyboard('{Escape}');
		await waitFor(() => expect(items()).toHaveLength(0));
		await waitFor(() => expect(trigger(canvasElement)).toHaveFocus());

		await user.keyboard('{Enter}');
		await waitFor(() => expect(items()).toHaveLength(3));
		await user.keyboard('{End}');
		await waitFor(() => expect(popupItems('Settings')).toHaveFocus());
		await user.keyboard('{Home}');
		await waitFor(() => expect(popupItems('Profile')).toHaveFocus());
		await user.keyboard('{ArrowUp}');
		await waitFor(() => expect(popupItems('Settings')).toHaveFocus());
		await user.keyboard('c');
		await waitFor(() => expect(popupItems('Chats')).toHaveFocus());
		await user.keyboard('{Escape}');
		await waitFor(() => expect(items()).toHaveLength(0));
		await waitFor(() => expect(trigger(canvasElement)).toHaveFocus());
	},
};

const SubmenuMenu = () => (
	<Menu title='Submenu' onAction={onAction}>
		<MenuItem key='profile'>Profile</MenuItem>
		<MenuSubmenuTrigger key='share' variant='danger'>
			<MenuItem aria-label='Share'>
				<MenuItemContent>Share</MenuItemContent>
			</MenuItem>
			<MenuItem key='copy-link'>Copy link</MenuItem>
			<MenuItem key='email'>Email</MenuItem>
		</MenuSubmenuTrigger>
		<MenuItem key='more' title='More'>
			<MenuItem key='extra'>Extra</MenuItem>
		</MenuItem>
		<MenuItem key='settings'>Settings</MenuItem>
	</Menu>
);

export const SubmenuKeyboard: Story = {
	render: () => <SubmenuMenu />,
	play: async ({ canvasElement }) => {
		stubResizeObserver();
		const user = userEvent.setup();
		trigger(canvasElement).focus();
		await user.keyboard('{Enter}');
		await waitFor(() => expect(items()).toHaveLength(4));
		await waitFor(() => expect(popupItems('Profile')).toHaveFocus());

		await user.keyboard('{ArrowDown}');
		const share = popupItems('Share');
		await waitFor(() => expect(share).toHaveFocus());
		await expect(share).toHaveAttribute('aria-haspopup', 'menu');
		await expect(share).toHaveAttribute('aria-expanded', 'false');
		await expect(share.tagName).toBe('DIV');
		await expect(share).toHaveClass('rcx-item--danger');
		await expect(share.querySelector('.rcx-item__icon svg, .rcx-item__icon i')).not.toBeNull();

		await user.keyboard('{ArrowRight}');
		await waitFor(() => expect(share).toHaveAttribute('aria-expanded', 'true'));
		await waitFor(() => expect(popupItems('Copy link')).toHaveFocus());
		await expect(share).toHaveAttribute('aria-controls');
		await expect(document.querySelectorAll('[role="menu"]')).toHaveLength(2);

		await user.keyboard('{ArrowDown}');
		await waitFor(() => expect(popupItems('Email')).toHaveFocus());
		await user.keyboard('{ArrowLeft}');
		await waitFor(() => expect(share).toHaveFocus());
		await waitFor(() => expect(share).toHaveAttribute('aria-expanded', 'false'));
		await expect(document.querySelectorAll('[role="menu"]')).toHaveLength(1);

		// Escape closes one level at a time
		await user.keyboard('{ArrowRight}');
		await waitFor(() => expect(popupItems('Copy link')).toHaveFocus());
		await user.keyboard('{Escape}');
		await waitFor(() => expect(share).toHaveFocus());
		await expect(document.querySelectorAll('[role="menu"]')).toHaveLength(1);
		await expect(items().length).toBeGreaterThan(0);
		await user.keyboard('{Escape}');
		await waitFor(() => expect(items()).toHaveLength(0));
		await waitFor(() => expect(trigger(canvasElement)).toHaveFocus());
	},
};

export const SubmenuActions: Story = {
	render: () => <SubmenuMenu />,
	play: async ({ canvasElement }) => {
		stubResizeObserver();
		onAction.mockClear();
		await userEvent.click(trigger(canvasElement));
		await body().findByRole('menu');
		await fireEvent.pointerEnter(popupItems('More'));
		await userEvent.click(popupItems('More'));
		await waitFor(() => expect(document.querySelectorAll('[role="menu"]')).toHaveLength(2));
		await userEvent.click(await body().findByRole('menuitem', { name: 'Extra' }));
		await expect(onAction).toHaveBeenCalledWith('extra');
		await waitFor(() => expect(items()).toHaveLength(0));
	},
};

export const PopupStructure: Story = {
	render: () => (
		<Menu title='Structure' maxWidth='320px'>
			<MenuItem key='one'>One</MenuItem>
			<MenuItem key='two'>Two</MenuItem>
		</Menu>
	),
	play: async ({ canvasElement }) => {
		stubResizeObserver();
		await userEvent.click(trigger(canvasElement));
		const menu = await body().findByRole('menu');
		await expect(menu.closest('.rcx-menu__popover') ?? menu.closest('.rcx-dropdown')).not.toBeNull();
		await expect(menu.querySelectorAll('label.rcx-item')).toHaveLength(2);
	},
};

// react-aria's `useMenuItem` output: the reference list below renders the same collection with a plain element and records
// what the hook hands it, so a Fuselage item that forwards less than react-aria returns is caught.
// the latest props of each item: a description slot id is dropped once its element turns out to be absent
const latest = new Map<string, Record<string, unknown>>();
const recorded = {
	get attributes() {
		return new Set(
			[...latest.values()].flatMap((props) =>
				Object.entries(props)
					.filter(([, v]) => typeof v !== 'function' && v !== undefined && v !== '')
					.map(([k]) => k),
			),
		);
	},
	get handlers() {
		return new Set(
			[...latest.values()].flatMap((props) =>
				Object.entries(props)
					.filter(([, v]) => typeof v === 'function')
					.map(([k]) => k),
			),
		);
	},
};

const ReferenceItem = ({ item, state }: { item: any; state: any }) => {
	const ref = useRef<HTMLDivElement>(null);
	const { menuItemProps } = useMenuItem({ key: item.key }, state, ref);
	latest.set(String(item.key), menuItemProps as Record<string, unknown>);
	return (
		<div {...mergeProps(menuItemProps)} ref={ref}>
			{item.rendered}
		</div>
	);
};

const ReferenceMenu = () => {
	const props = { 'aria-label': 'reference', 'children': [<AriaItem key='a'>Alpha</AriaItem>, <AriaItem key='b'>Beta</AriaItem>] };
	const state = useTreeState(props as any);
	const ref = useRef<HTMLDivElement>(null);
	const { menuProps } = useMenu(props as any, state, ref);
	return (
		<div {...menuProps} ref={ref}>
			{[...state.collection].map((item) => (
				<ReferenceItem key={item.key} item={item} state={state} />
			))}
		</div>
	);
};

const domAttribute = (name: string) => (name === 'tabIndex' ? 'tabindex' : name);

export const MenuItemForwardsEveryReactAriaProp: Story = {
	render: () => (
		<>
			<ReferenceMenu />
			<Menu title='Forwarding'>
				<MenuItem key='a'>Alpha</MenuItem>
				<MenuItem key='b'>Beta</MenuItem>
			</Menu>
		</>
	),
	play: async ({ canvasElement }) => {
		stubResizeObserver();
		await expect(recorded.attributes.size).toBeGreaterThan(2);
		await userEvent.click(within(canvasElement).getByRole('button'));
		await body().findByRole('menu', { name: 'Forwarding' });
		const first = items().find((item) => !canvasElement.contains(item) && item.textContent === 'Alpha') as HTMLElement;
		await expect(first).toBeDefined();

		// every attribute react-aria returns for an item reaches the element, except the ones that are the item's own state
		const missing = [...recorded.attributes].filter(
			(name) => !['id', 'aria-labelledby', 'data-key'].includes(name) && !first.hasAttribute(domAttribute(name)),
		);
		await expect(missing).toEqual([]);
		// every handler is one the row forwards, `onPointerUp` being re-bound to `onPointerDown`. `onDragStartCapture` is not in
		// `webRowHandlerKeys` yet develop's Item forwards it through its rest spread, so a rewrite has to keep it
		const forwarded: readonly string[] = [...webRowHandlerKeys, 'onPointerUp', 'onDragStartCapture'];
		for (const name of recorded.handlers) {
			await expect(forwarded).toContain(name);
		}
	},
};

const EXPECTED_CLASSES = [
	'root > div[0] > div[0]: rcx-item-group-header rcx-item-group-header--inset-md',
	'root > div[0] > div[0] > div: rcx-item-group-title',
	'root > div[0] > div[1] > label: rcx-item rcx-item--clickable rcx-item--focus-managed rcx-item--inset-md',
	'root > div[0] > div[1] > label > div[0]: rcx-item__icon rcx-option__column',
	'root > div[0] > div[1] > label > div[0] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-user rcx-option__icon',
	'root > div[0] > div[1] > label > div[1]: rcx-item__content rcx-option__content',
	'root > div[0] > div[1] > label > div[1] > div: rcx-item__title',
	'root > div[1]: rcx-item-divider',
	'root > div[2] > div > label: rcx-item rcx-item--clickable rcx-item--focus-managed rcx-item--inset-md',
	'root > div[2] > div > label > div: rcx-item__content',
	'root > div[2] > div > label > div > div: rcx-item__title',
].join('\n');

const EXPECTED_ARIA = [
	'- text: "Group"',
	'- group "Group":',
	'  - menuitem "Alpha":',
	'    - text: "Alpha"',
	'- separator',
	'- group:',
	'  - menuitem "Beta":',
	'    - text: "Beta"',
].join('\n');

export const ClassAndAccessibilityContract: Story = {
	render: () => (
		<Menu title='Contract'>
			<MenuSection title='Group'>
				<MenuItem key='a' aria-label='Alpha'>
					<MenuItemIcon name='user' />
					<MenuItemContent>Alpha</MenuItemContent>
				</MenuItem>
			</MenuSection>
			<MenuSection>
				<MenuItem key='b'>Beta</MenuItem>
			</MenuSection>
		</Menu>
	),
	play: async ({ canvasElement }) => {
		stubResizeObserver();
		await userEvent.click(trigger(canvasElement));
		const menu = await body().findByRole('menu');
		await expect(classContract(menu)).toBe(EXPECTED_CLASSES);
		await expect(ariaSnapshot(menu)).toBe(EXPECTED_ARIA);
	},
};
