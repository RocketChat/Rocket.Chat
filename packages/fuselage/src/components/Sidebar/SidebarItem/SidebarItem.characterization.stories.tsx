import type { Meta, StoryObj } from '@storybook/react';
import { createRef } from 'react';
import type { MouseEvent, RefObject } from 'react';
import { expect, fn, userEvent } from 'storybook/test';

import {
	SidebarItem,
	SidebarItemAction,
	SidebarItemActions,
	SidebarItemAvatarWrapper,
	SidebarItemBadge,
	SidebarItemCol,
	SidebarItemContent,
	SidebarItemIcon,
	SidebarItemLink,
	SidebarItemMenu,
	SidebarItemRow,
	SidebarItemStatusBullet,
	SidebarItemTimestamp,
	SidebarItemTitle,
	SidebarListItem,
} from '.';
import { ariaSnapshot, computed, expectForwards, expectTabOrder, isJsdom, shellClasses } from '../../../testing/g0';
import { IconButton } from '../../Button';
import SidebarLink from '../SidebarLink';

// G0 characterization of the SidebarItem family on its develop implementation. A rewrite passes these unedited, in jest and in the
// compiled zero-runtime Storybook; see src/testing/README.md.
export default {
	title: 'Characterization/SidebarItem',
	component: SidebarItem,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof SidebarItem>;

type Story = StoryObj<typeof SidebarItem>;

const attributes = (name: string) => ({
	'className': `consumer-${name}`,
	'id': `${name}-id`,
	'title': `${name} title`,
	'data-qa': `${name}-qa`,
	'data-anything': `${name}-anything`,
	'aria-label': `${name} label`,
});

const handlers = () => ({
	onClick: fn(),
	onKeyDown: fn(),
	onKeyUp: fn(),
	onMouseDown: fn(),
	onMouseEnter: fn(),
	onMouseLeave: fn(),
	onPointerDown: fn(),
	onPointerUp: fn(),
	onFocus: fn(),
	onBlur: fn(),
});

const preventNavigation = (event: MouseEvent) => event.preventDefault();

const refs = {
	anchor: createRef<HTMLElement>(),
	container: createRef<HTMLElement>(),
};
const anchorHandlers = { ...handlers(), onClick: fn(preventNavigation) };
const containerHandlers = handlers();

export const RowForwarding: Story = {
	render: () => (
		<>
			<SidebarItem
				{...attributes('anchor')}
				ref={refs.anchor}
				{...anchorHandlers}
				href='/channel/general'
				target='_blank'
				rel='noopener noreferrer'
				download='general'
			/>
			<SidebarItem
				{...attributes('container')}
				ref={refs.container}
				{...containerHandlers}
				is='div'
				role='group'
				tabIndex={0}
				href='/ignored'
			/>
		</>
	),
	play: async ({ canvasElement }) => {
		const anchor = canvasElement.querySelector('#anchor-id') as HTMLElement;
		await expect(anchor.tagName).toBe('A');
		const { onClick: _click, ...others } = anchorHandlers;
		await expectForwards(canvasElement, anchor, { ...attributes('anchor'), ref: refs.anchor, handlers: others });
		await userEvent.click(anchor);
		await expect(anchorHandlers.onClick).toHaveBeenCalled();
		await expect(anchor).toHaveAttribute('href', '/channel/general');
		await expect(anchor).toHaveAttribute('target', '_blank');
		await expect(anchor).toHaveAttribute('rel', 'noopener noreferrer');
		await expect(anchor).toHaveAttribute('download', 'general');

		const container = canvasElement.querySelector('#container-id') as HTMLElement;
		await expect(container.tagName).toBe('DIV');
		await expectForwards(canvasElement, container, { ...attributes('container'), ref: refs.container, handlers: containerHandlers });
		await expect(container).toHaveAttribute('role', 'group');
		await expect(container).toHaveAttribute('tabindex', '0');
		// A container row is not a link, so the anchor's attributes stay off it
		await expect(container).not.toHaveAttribute('href');
	},
};

const partNames = ['avatar', 'title', 'content', 'col', 'row', 'timestamp', 'menu', 'actions', 'link', 'listitem', 'itemicon'] as const;
const partRefs = Object.fromEntries(partNames.map((name) => [name, createRef<HTMLElement>()])) as Record<
	(typeof partNames)[number],
	RefObject<HTMLElement>
>;
const partHandlers = { onClick: fn(), onFocus: fn(), onBlur: fn(), onMouseEnter: fn(), onKeyDown: fn() };

export const PartsForwarding: Story = {
	render: () => (
		<SidebarListItem {...attributes('listitem')} ref={partRefs.listitem as RefObject<HTMLDivElement>} {...partHandlers}>
			<SidebarItem is='div'>
				<SidebarItemAvatarWrapper {...attributes('avatar')} ref={partRefs.avatar} {...partHandlers} />
				<SidebarItemIcon icon='balloons' label='Channel' className='consumer-itemicon' />
				<SidebarItemCol {...attributes('col')} ref={partRefs.col} {...partHandlers}>
					<SidebarItemRow {...attributes('row')} ref={partRefs.row} {...partHandlers}>
						<SidebarItemTitle {...attributes('title')} ref={partRefs.title} {...partHandlers}>
							<SidebarItemLink
								href='#room'
								{...attributes('link')}
								ref={partRefs.link as RefObject<HTMLAnchorElement>}
								onClick={fn(preventNavigation)}
							>
								Name
							</SidebarItemLink>
						</SidebarItemTitle>
						<SidebarItemTimestamp {...attributes('timestamp')} ref={partRefs.timestamp} {...partHandlers}>
							10:42
						</SidebarItemTimestamp>
					</SidebarItemRow>
					<SidebarItemContent {...attributes('content')} ref={partRefs.content} {...partHandlers}>
						Last message
					</SidebarItemContent>
				</SidebarItemCol>
				<SidebarItemMenu {...attributes('menu')} ref={partRefs.menu} {...partHandlers}>
					<IconButton size='mini' icon='kebab' aria-label='Options' />
				</SidebarItemMenu>
				<SidebarItemActions {...attributes('actions')} ref={partRefs.actions} {...partHandlers}>
					<IconButton size='mini' icon='phone' aria-label='Call' />
				</SidebarItemActions>
			</SidebarItem>
		</SidebarListItem>
	),
	play: async ({ canvasElement }) => {
		for (const name of partNames.filter((part) => part !== 'link' && part !== 'itemicon')) {
			const element = canvasElement.querySelector(`#${name}-id`) as HTMLElement;
			await expectForwards(canvasElement, element, { ...attributes(name), ref: partRefs[name], handlers: partHandlers });
		}
		await expectForwards(canvasElement, '#link-id', { ...attributes('link'), ref: partRefs.link });
		await expectForwards(canvasElement, '.rcx-sidebar-item__icon', { className: 'consumer-itemicon' });

		await expect(canvasElement.querySelector('#listitem-id')).toHaveAttribute('role', 'listitem');
		await expect(canvasElement.querySelector('#link-id')?.tagName).toBe('A');
		await expect(canvasElement.querySelector('.rcx-sidebar-item__icon')).toHaveAttribute('aria-label', 'Channel');
	},
};

export const BadgeAndBullet: Story = {
	render: () => (
		<SidebarItem is='div'>
			<SidebarItemStatusBullet status='online' />
			<SidebarItemBadge {...attributes('badge')} variant='danger'>
				5
			</SidebarItemBadge>
		</SidebarItem>
	),
	play: async ({ canvasElement }) => {
		const badge = canvasElement.querySelector('#badge-id') as HTMLElement;
		await expect(badge).toHaveTextContent('5');
		await expectForwards(canvasElement, badge, { className: 'consumer-badge', id: 'badge-id', title: 'badge title', ref: undefined });
		await expect(badge).toHaveClass('rcx-sidebar-item__badge');
		await expect(canvasElement.querySelector('.rcx-sidebar-item__status-bullet')).not.toBeNull();
	},
};

const onAction = fn();
const actionHandlers = { onFocus: fn(), onBlur: fn(), onMouseEnter: fn(), onKeyDown: fn() };

export const ItemActionElement: Story = {
	render: () => (
		<SidebarItemAction {...attributes('action')} {...actionHandlers} onClick={onAction} icon='plus'>
			Create
		</SidebarItemAction>
	),
	play: async ({ canvasElement }) => {
		const action = canvasElement.querySelector('#action-id') as HTMLElement;
		await expect(action).toHaveAttribute('role', 'button');
		await expect(action).toHaveAttribute('tabindex', '0');
		await expect(action.querySelector('svg, i, span')).not.toBeNull();
		await expect(action).toHaveTextContent('Create');
		await expectForwards(canvasElement, action, { ...attributes('action'), handlers: { ...actionHandlers, onClick: onAction } });
		await expect(action).toHaveClass('rcx-sidebar-item', 'rcx-sidebar-item__action');
		await userEvent.click(action);
		await expect(onAction).toHaveBeenCalled();
	},
};

const linkClick = fn();
const linkKey = fn();
const parentClick = fn();
const parentKey = fn();

export const SidebarLinkBehavior: Story = {
	render: () => (
		// The container only observes what bubbles out of the link
		// oxlint-disable-next-line jsx-a11y/no-static-element-interactions
		<div onClick={parentClick} onKeyDown={parentKey}>
			<SidebarLink
				{...attributes('link')}
				href='#directory'
				target='_blank'
				rel='noopener'
				icon='team'
				badge={<SidebarItemBadge>2</SidebarItemBadge>}
				menu={<IconButton size='mini' icon='kebab' aria-label='Options' />}
				onClick={linkClick}
				onKeyDown={linkKey}
			>
				Directory
			</SidebarLink>
			<SidebarLink id='plain-link' href='#plain'>
				Plain
			</SidebarLink>
		</div>
	),
	play: async ({ canvasElement }) => {
		const link = canvasElement.querySelector('#link-id') as HTMLElement;
		await expect(link.tagName).toBe('A');
		await expectForwards(canvasElement, link, { ...attributes('link'), ref: undefined });
		await expect(link).toHaveAttribute('href', '#directory');
		await expect(link).toHaveAttribute('target', '_blank');
		await expect(link).toHaveAttribute('rel', 'noopener');
		await expect(link).toHaveClass('rcx-sidebar-link', 'rcx-sidebar-item');
		await expect(link).toHaveAttribute('role', 'link');
		await expect(link).toHaveAttribute('tabindex', '0');
		await expect(link.querySelector('.rcx-item__actions--reveal-hover button')).toHaveAccessibleName('Options');
		await expect(link).toHaveTextContent('Directory');

		const plain = canvasElement.querySelector('#plain-link') as HTMLElement;
		await userEvent.click(plain);
		// The link keeps its clicks and Enter keys from the rows and groups that wrap it
		await expect(parentClick).not.toHaveBeenCalled();
		plain.focus();
		await userEvent.keyboard('{Enter}');
		await expect(parentKey).not.toHaveBeenCalled();
		await userEvent.keyboard('{ArrowDown}');
		await expect(parentKey).toHaveBeenCalledTimes(1);

		linkClick.mockClear();
		await userEvent.click(link);
		await expect(linkClick).toHaveBeenCalledTimes(1);
	},
};

export const ClassContract: Story = {
	render: () => (
		<div role='list' aria-label='Rooms'>
			<SidebarListItem>
				<SidebarItem href='#a' id='anchor-row'>
					<SidebarItemAvatarWrapper />
					<SidebarItemTitle>Anchor</SidebarItemTitle>
					<SidebarItemMenu>
						<IconButton size='mini' icon='kebab' aria-label='Options' />
					</SidebarItemMenu>
				</SidebarItem>
			</SidebarListItem>
			<SidebarListItem>
				<SidebarItem is='div' id='container-row' selected highlighted>
					<SidebarItemTitle>
						<SidebarItemLink href='#b' id='row-link'>
							Container
						</SidebarItemLink>
					</SidebarItemTitle>
					<SidebarItemActions>
						<IconButton size='mini' icon='phone' aria-label='Call' />
					</SidebarItemActions>
				</SidebarItem>
			</SidebarListItem>
			<SidebarListItem>
				<SidebarItem href='#c' level={2} id='level-2-row'>
					<SidebarItemCol>
						<SidebarItemRow>
							<SidebarItemTitle>Level 2</SidebarItemTitle>
							<SidebarItemTimestamp>1:00</SidebarItemTimestamp>
						</SidebarItemRow>
						<SidebarItemContent>Description</SidebarItemContent>
					</SidebarItemCol>
				</SidebarItem>
			</SidebarListItem>
			<SidebarListItem>
				<SidebarLink href='#d' id='link-row' selected menu={<IconButton size='mini' icon='kebab' aria-label='More' />}>
					Link
				</SidebarLink>
			</SidebarListItem>
			<SidebarItemAction onClick={() => undefined}>Add</SidebarItemAction>
		</div>
	),
	play: async ({ canvasElement }) => {
		const find = (selector: string) => canvasElement.querySelector(selector) as HTMLElement;
		const firstOwn = (element: HTMLElement) => Array.from(element.classList).find((name) => name.startsWith('rcx-'));

		// The app's keyboard and shortcut hooks find rows, links, group titles and kebabs through these
		for (const row of ['#anchor-row', '#container-row', '#level-2-row', '#link-row']) {
			await expect(find(row)).toHaveClass('rcx-item', 'rcx-sidebar-item');
			await expect(find(row).closest('[role=listitem]')).toHaveClass('rcx-sidebar-item__list-item');
			// Focus is re-found through the first `rcx-*` class of the focused element
			await expect(firstOwn(find(row))).toBe('rcx-item');
		}
		await expect(find('#row-link')).toHaveClass('rcx-item__link', 'rcx-sidebar-item__link');
		await expect(firstOwn(find('#row-link'))).toBe('rcx-item__link');
		await expect(find('#row-link').closest('[role=listitem]')).not.toBeNull();
		await expect(canvasElement.querySelectorAll('.rcx-item__actions--reveal-hover button')).toHaveLength(2);
		await expect(find('#container-row .rcx-sidebar-item__actions')).not.toHaveClass('rcx-item__actions--reveal-hover');

		await expect(find('#container-row')).toHaveClass('rcx-sidebar-item--selected', 'rcx-sidebar-item--level-1');
		await expect(find('#level-2-row')).toHaveClass('rcx-sidebar-item--level-2');
		await expect(find('#level-2-row')).not.toHaveClass('rcx-sidebar-item--selected');
		await expect(find('#link-row')).toHaveClass('rcx-sidebar-link', 'rcx-sidebar-item--selected');

		await expect(shellClasses(canvasElement)).toBe(
			[
				'root > div > div[0]: rcx-sidebar-item__list-item',
				'root > div > div[0] > a: rcx-item rcx-sidebar-item rcx-sidebar-item--level-1',
				'root > div > div[0] > a > div[0]: rcx-sidebar-item__avatar',
				'root > div > div[0] > a > div[1]: rcx-sidebar-item__title',
				'root > div > div[0] > a > div[2]: rcx-item__actions--reveal-hover rcx-sidebar-item__menu-wrapper',
				'root > div > div[0] > a > div[2] > div > span: rcx-sidebar-item__menu',
				'root > div > div[1]: rcx-sidebar-item__list-item',
				'root > div > div[1] > div: rcx-item rcx-sidebar-item rcx-sidebar-item--level-1 rcx-sidebar-item--selected',
				'root > div > div[1] > div > div[0]: rcx-sidebar-item__title',
				'root > div > div[1] > div > div[0] > a: rcx-item__link rcx-sidebar-item__link',
				'root > div > div[1] > div > div[1]: rcx-sidebar-item__actions',
				'root > div > div[2]: rcx-sidebar-item__list-item',
				'root > div > div[2] > a: rcx-item rcx-sidebar-item rcx-sidebar-item--level-2',
				'root > div > div[2] > a > div: rcx-sidebar-item__col',
				'root > div > div[2] > a > div > div[0]: rcx-sidebar-item__row',
				'root > div > div[2] > a > div > div[0] > div[0]: rcx-sidebar-item__title',
				'root > div > div[2] > a > div > div[0] > div[1]: rcx-sidebar-item__timestamp',
				'root > div > div[2] > a > div > div[1]: rcx-sidebar-item__subtitle',
				'root > div > div[3]: rcx-sidebar-item__list-item',
				'root > div > div[3] > a: rcx-item rcx-sidebar-item rcx-sidebar-item--selected rcx-sidebar-link',
				'root > div > div[3] > a > span: rcx-sidebar-item__title',
				'root > div > div[3] > a > div: rcx-item__actions--reveal-hover rcx-sidebar-item__menu-wrapper',
				'root > div > div[3] > a > div > div > span: rcx-sidebar-item__menu',
				'root > div > div[4]: rcx-sidebar-item rcx-sidebar-item__action',
			].join('\n'),
		);
	},
};

export const HighlightedAndSelected: Story = {
	render: () => (
		<div role='list'>
			<SidebarListItem>
				<SidebarItem is='div' id='resting'>
					<SidebarItemIcon icon='team' />
					<SidebarItemCol>
						<SidebarItemRow>
							<SidebarItemTitle id='resting-title'>Resting</SidebarItemTitle>
							<SidebarItemTimestamp id='resting-time'>10:00</SidebarItemTimestamp>
						</SidebarItemRow>
						<SidebarItemContent id='resting-description'>Description</SidebarItemContent>
					</SidebarItemCol>
				</SidebarItem>
			</SidebarListItem>
			<SidebarListItem>
				<SidebarItem is='div' id='highlighted' highlighted>
					<SidebarItemIcon icon='team' />
					<SidebarItemCol>
						<SidebarItemRow>
							<SidebarItemTitle id='highlighted-title'>Highlighted</SidebarItemTitle>
							<SidebarItemTimestamp id='highlighted-time'>10:00</SidebarItemTimestamp>
						</SidebarItemRow>
						<SidebarItemContent id='highlighted-description'>Description</SidebarItemContent>
					</SidebarItemCol>
				</SidebarItem>
			</SidebarListItem>
			<SidebarListItem>
				<SidebarItem is='div' id='selected' selected>
					<SidebarItemTitle>Selected</SidebarItemTitle>
				</SidebarItem>
			</SidebarListItem>
			<SidebarListItem>
				<SidebarItem is='div' id='level-1'>
					<SidebarItemTitle>Level 1</SidebarItemTitle>
				</SidebarItem>
			</SidebarListItem>
			<SidebarListItem>
				<SidebarItem is='div' id='level-2' level={2}>
					<SidebarItemTitle>Level 2</SidebarItemTitle>
				</SidebarItem>
			</SidebarListItem>
		</div>
	),
	play: async ({ canvasElement }) => {
		// jsdom loads no stylesheet
		if (isJsdom()) return;
		const find = (selector: string) => canvasElement.querySelector(selector) as Element;
		const weight = (selector: string) => computed(find(selector), 'font-weight');

		// An unread row is highlighted as a whole: its title, subtitle and time share the emphasis
		for (const part of ['title', 'time', 'description']) {
			await expect(weight(`#highlighted-${part}`)).toBe('500');
			await expect(weight(`#resting-${part}`)).not.toBe('500');
		}
		await expect(computed(find('#highlighted-description'), 'color')).not.toBe(computed(find('#resting-description'), 'color'));

		await expect(computed(find('#selected'), 'background-color')).not.toBe(computed(find('#resting'), 'background-color'));
		await expect(computed(find('#selected'), 'background-color')).not.toBe('rgba(0, 0, 0, 0)');

		await expect(computed(find('#level-2'), 'padding-top')).toBe('8px');
		await expect(computed(find('#level-2'), 'padding-bottom')).toBe('8px');
		await expect(computed(find('#level-1'), 'padding-top')).not.toBe('8px');
	},
};

export const Keyboard: Story = {
	render: () => (
		<div role='list' aria-label='Rooms'>
			<SidebarListItem>
				<SidebarItem href='#one' id='row-one' onClick={preventNavigation}>
					<SidebarItemTitle>One</SidebarItemTitle>
					<SidebarItemMenu>
						<IconButton size='mini' icon='kebab' aria-label='Options one' id='menu-one' />
					</SidebarItemMenu>
				</SidebarItem>
			</SidebarListItem>
			<SidebarListItem>
				<SidebarItem is='div' id='row-two'>
					<SidebarItemTitle>
						<SidebarItemLink href='#two' id='link-two' onClick={preventNavigation}>
							Two
						</SidebarItemLink>
					</SidebarItemTitle>
					<SidebarItemMenu>
						<IconButton size='mini' icon='kebab' aria-label='Options two' id='menu-two' />
					</SidebarItemMenu>
				</SidebarItem>
			</SidebarListItem>
			<SidebarListItem>
				<SidebarItem href='#three' id='row-three' onClick={preventNavigation}>
					<SidebarItemTitle>Three</SidebarItemTitle>
				</SidebarItem>
			</SidebarListItem>
		</div>
	),
	play: async ({ canvasElement }) => {
		// The arrow keys of the list are the app's (`useSidebarListNavigation`): the rows only promise a stable Tab order
		await expectTabOrder(
			['#row-one', '#menu-one', '#link-two', '#menu-two', '#row-three'].map(
				(selector) => canvasElement.querySelector(selector) as HTMLElement,
			),
		);
	},
};

export const AccessibilityTree: Story = {
	render: () => (
		<div role='list' aria-label='Rooms'>
			<SidebarListItem>
				<SidebarItem is='div'>
					<SidebarItemIcon icon='team' label='Team' />
					<SidebarItemTitle>
						<SidebarItemLink href='#design'>design-system</SidebarItemLink>
					</SidebarItemTitle>
					<SidebarItemBadge title='unread messages'>5</SidebarItemBadge>
					<SidebarItemMenu>
						<IconButton size='mini' icon='kebab' aria-label='Options' />
					</SidebarItemMenu>
				</SidebarItem>
			</SidebarListItem>
			<SidebarListItem>
				<SidebarLink href='#directory' icon='magnifier'>
					Directory
				</SidebarLink>
			</SidebarListItem>
		</div>
	),
	play: async ({ canvasElement }) => {
		await expect(ariaSnapshot(canvasElement)).toBe(
			[
				'- list "Rooms":',
				'  - listitem:',
				'    - img "Team"',
				'    - link "design-system"',
				'    - text: "5"',
				'    - button "Options"',
				'  - listitem:',
				'    - link "Directory"',
			].join('\n'),
		);
	},
};
