import type { Meta, StoryObj } from '@storybook/react';
import { createRef } from 'react';
import type { MouseEvent, RefObject } from 'react';
import { expect, fireEvent, fn, userEvent, waitFor } from 'storybook/test';

import Item from './Item';
import ItemActions from './ItemActions';
import ItemContent from './ItemContent';
import ItemDescription from './ItemDescription';
import ItemDivider from './ItemDivider';
import ItemDragHandle from './ItemDragHandle';
import ItemDropSlot from './ItemDropSlot';
import ItemGroup from './ItemGroup';
import ItemGroupHeader from './ItemGroupHeader';
import ItemGroupTitle from './ItemGroupTitle';
import ItemIcon from './ItemIcon';
import ItemLink from './ItemLink';
import ItemMedia from './ItemMedia';
import ItemMeta from './ItemMeta';
import ItemRow from './ItemRow';
import ItemSkeleton from './ItemSkeleton';
import ItemTitle from './ItemTitle';
import { ariaSnapshot, classContract, expectForwards, expectKeyboardActivation, expectTabOrder } from '../../testing/g0';
import { IconButton } from '../Button';

// G0 characterization of the Item family on its develop implementation. A rewrite passes these unedited, in jest and in the
// compiled zero-runtime Storybook; see src/testing/README.md.
export default {
	title: 'Characterization/Item',
	component: Item,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof Item>;

type Story = StoryObj<typeof Item>;

const handlers = () => ({
	onClick: fn(),
	onContextMenu: fn(),
	onKeyDown: fn(),
	onKeyUp: fn(),
	onMouseDown: fn(),
	onMouseEnter: fn(),
	onMouseLeave: fn(),
	onMouseUp: fn(),
	onPointerDown: fn(),
	onPointerUp: fn(),
	onTouchStart: fn(),
	onTouchEnd: fn(),
	onFocus: fn(),
	onBlur: fn(),
});

const itemHandlers = handlers();
const pointerHandlers = { onPointerEnter: fn(), onPointerLeave: fn(), onPointerMove: fn(), onClickCapture: fn() };
const refs = {
	div: createRef<HTMLElement>(),
	li: createRef<HTMLElement>(),
	a: createRef<HTMLElement>(),
	label: createRef<HTMLElement>(),
};

const attributes = (name: string) => ({
	'className': `consumer-${name}`,
	'id': `${name}-id`,
	'title': `${name} title`,
	'data-qa': `${name}-qa`,
	'data-anything': `${name}-anything`,
	'aria-label': `${name} label`,
});

export const ItemForwarding: Story = {
	render: () => (
		<>
			<Item {...attributes('div')} ref={refs.div} {...itemHandlers} {...pointerHandlers} role='group' tabIndex={0} />
			<ul>
				<Item is='li' {...attributes('li')} ref={refs.li} {...handlers()} aria-selected='true' />
			</ul>
			<Item
				is='a'
				{...attributes('a')}
				ref={refs.a}
				href='/room'
				target='_blank'
				rel='noopener'
				download='file'
				{...handlers()}
				onClick={(event: MouseEvent) => event.preventDefault()}
			/>
			<Item is='label' {...attributes('label')} ref={refs.label} {...handlers()} />
		</>
	),
	play: async ({ canvasElement }) => {
		const div = canvasElement.querySelector('#div-id') as HTMLElement;
		await expectForwards(canvasElement, div, { ...attributes('div'), ref: refs.div, handlers: itemHandlers });
		await expect(div.tagName).toBe('DIV');
		// React derives the enter and leave props from the over and out events, and the capture click from the click
		await fireEvent.pointerOver(div);
		await fireEvent.pointerOut(div);
		await fireEvent.pointerMove(div);
		await fireEvent.click(div);
		for (const handler of Object.values(pointerHandlers)) {
			await expect(handler).toHaveBeenCalled();
		}
		await expect(div).toHaveAttribute('role', 'group');
		await expect(div).toHaveAttribute('tabindex', '0');

		const li = canvasElement.querySelector('#li-id') as HTMLElement;
		await expect(li.tagName).toBe('LI');
		await expectForwards(canvasElement, li, { ...attributes('li'), ref: refs.li });
		await expect(li).toHaveAttribute('aria-selected', 'true');

		const anchor = canvasElement.querySelector('#a-id') as HTMLElement;
		await expect(anchor.tagName).toBe('A');
		await expectForwards(canvasElement, anchor, { ...attributes('a'), ref: refs.a });
		await expect(anchor).toHaveAttribute('href', '/room');
		await expect(anchor).toHaveAttribute('target', '_blank');
		await expect(anchor).toHaveAttribute('rel', 'noopener');
		await expect(anchor).toHaveAttribute('download', 'file');

		const label = canvasElement.querySelector('#label-id') as HTMLElement;
		await expect(label.tagName).toBe('LABEL');
		await expectForwards(canvasElement, label, { ...attributes('label'), ref: refs.label });
	},
};

const clickSpy = fn();
const disabledClickSpy = fn();

export const DisabledSwallowsClick: Story = {
	render: () => (
		<>
			<Item id='enabled-row' onClick={clickSpy} />
			<Item id='disabled-row' disabled onClick={disabledClickSpy} />
		</>
	),
	play: async ({ canvasElement }) => {
		clickSpy.mockClear();
		disabledClickSpy.mockClear();
		await userEvent.click(canvasElement.querySelector('#enabled-row') as HTMLElement);
		await userEvent.click(canvasElement.querySelector('#disabled-row') as HTMLElement);
		await expect(clickSpy).toHaveBeenCalledTimes(1);
		await expect(disabledClickSpy).not.toHaveBeenCalled();
	},
};

const partHandlers = { onClick: fn(), onFocus: fn(), onBlur: fn(), onMouseEnter: fn(), onKeyDown: fn() };
const partRefs = Object.fromEntries(
	[
		'content',
		'row',
		'title',
		'description',
		'meta',
		'media',
		'icon',
		'actions',
		'link',
		'group',
		'header',
		'grouptitle',
		'divider',
		'handle',
		'slot',
	].map((name) => [name, createRef<HTMLElement>()]),
);

export const PartsForwarding: Story = {
	render: () => (
		<ItemGroup is='ul' {...attributes('group')} ref={partRefs.group} {...partHandlers}>
			<ItemGroupHeader is='li' aria-hidden {...attributes('header')} ref={partRefs.header} {...partHandlers}>
				<ItemGroupTitle {...attributes('grouptitle')} ref={partRefs.grouptitle} {...partHandlers} />
			</ItemGroupHeader>
			<Item is='li'>
				<ItemMedia {...attributes('media')} ref={partRefs.media} {...partHandlers} />
				<ItemIcon {...attributes('icon')} ref={partRefs.icon} {...partHandlers} />
				<ItemContent {...attributes('content')} ref={partRefs.content} {...partHandlers}>
					<ItemRow {...attributes('row')} ref={partRefs.row} {...partHandlers}>
						<ItemTitle {...attributes('title')} ref={partRefs.title} {...partHandlers}>
							<ItemLink href='#link' {...attributes('link')} ref={partRefs.link as RefObject<HTMLAnchorElement>} {...partHandlers} onClick={fn((e: MouseEvent) => e.preventDefault())}>
								Name
							</ItemLink>
						</ItemTitle>
						<ItemMeta {...attributes('meta')} ref={partRefs.meta} {...partHandlers}>
							10:42
						</ItemMeta>
					</ItemRow>
					<ItemDescription {...attributes('description')} ref={partRefs.description} {...partHandlers}>
						Last message
					</ItemDescription>
				</ItemContent>
				<ItemActions {...attributes('actions')} ref={partRefs.actions} {...partHandlers}>
					<IconButton size='mini' icon='kebab' aria-label='Options' />
				</ItemActions>
				<ItemDragHandle {...attributes('handle')} ref={partRefs.handle} {...partHandlers} />
			</Item>
			<ItemDivider is='li' aria-hidden {...attributes('divider')} ref={partRefs.divider} {...partHandlers} />
			<ItemDropSlot is='li' {...attributes('slot')} ref={partRefs.slot} {...partHandlers}>
				Drop here
			</ItemDropSlot>
		</ItemGroup>
	),
	play: async ({ canvasElement }) => {
		const parts = [
			['group', 'ul'],
			['header', 'li'],
			['grouptitle', 'div'],
			['media', 'div'],
			['icon', 'div'],
			['content', 'div'],
			['row', 'div'],
			['title', 'div'],
			['link', 'a'],
			['meta', 'div'],
			['description', 'div'],
			['actions', 'div'],
			['handle', 'span'],
			['divider', 'li'],
			['slot', 'li'],
		] as const;
		for (const [name, tag] of parts) {
			const element = canvasElement.querySelector(`#${name}-id`) as HTMLElement;
			await expect(element.tagName.toLowerCase()).toBe(tag);
			// the click of an ItemLink is the one handler its own spy would block, so it is asserted last
			const { onClick: _onClick, ...others } = partHandlers;
			await expectForwards(canvasElement, element, {
				...attributes(name),
				ref: partRefs[name],
				handlers: name === 'link' ? undefined : { ...others },
			});
		}
		await expect(canvasElement.querySelector('#group-id')).not.toHaveClass('consumer-header');
	},
};

export const ItemLinkElements: Story = {
	render: () => {
		const onClick = fn();
		return (
			<>
				<Item>
					<ItemLink href='/room' target='_blank' rel='noopener' id='anchor-link' aria-current='page' onClick={onClick}>
						Anchor
					</ItemLink>
				</Item>
				<Item>
					<ItemLink is='button' id='button-link' name='n' value='v' disabled onClick={onClick}>
						Button
					</ItemLink>
				</Item>
				<Item>
					<ItemLink is='button' id='button-default'>
						Default type
					</ItemLink>
				</Item>
			</>
		);
	},
	play: async ({ canvasElement }) => {
		const anchor = canvasElement.querySelector('#anchor-link') as HTMLElement;
		await expect(anchor.tagName).toBe('A');
		await expect(anchor).toHaveClass('rcx-item__link');
		await expect(anchor).toHaveAttribute('href', '/room');
		await expect(anchor).toHaveAttribute('target', '_blank');
		await expect(anchor).toHaveAttribute('aria-current', 'page');
		const button = canvasElement.querySelector('#button-link') as HTMLButtonElement;
		await expect(button.tagName).toBe('BUTTON');
		await expect(button).toHaveAttribute('type', 'button');
		await expect(button).toBeDisabled();
		await expect(button).toHaveAttribute('name', 'n');
		await expect(canvasElement.querySelector('#button-default')).toHaveAttribute('type', 'button');
	},
};

export const Naming: Story = {
	render: () => (
		<>
			<Item id='menu-item' role='menuitem'>
				<ItemIcon label='Private channel' id='status-icon' />
				<ItemContent>
					<ItemTitle id='menu-title'>Settings</ItemTitle>
				</ItemContent>
			</Item>
			<Item id='menu-labelled' role='menuitem' aria-labelledby='custom' aria-describedby='extra'>
				<ItemContent>
					<ItemTitle>Other</ItemTitle>
				</ItemContent>
			</Item>
			<Item id='plain-row' role='option'>
				<ItemContent>
					<ItemTitle>Plain</ItemTitle>
				</ItemContent>
			</Item>
			<Item id='linked-row'>
				<ItemIcon label='Away' id='away-icon' />
				<ItemTitle>
					<ItemLink href='#x' id='linked-link' aria-describedby='mine'>
						Linked
					</ItemLink>
				</ItemTitle>
			</Item>
			<ItemGroup is='ul' id='titled'>
				<ItemGroupHeader is='li' aria-hidden>
					<ItemGroupTitle id='group-title'>Favorites</ItemGroupTitle>
				</ItemGroupHeader>
			</ItemGroup>
			<ItemGroup is='ul' id='own-label' aria-label='Mine'>
				<ItemGroupHeader is='li' aria-hidden>
					<ItemGroupTitle>Ignored</ItemGroupTitle>
				</ItemGroupHeader>
			</ItemGroup>
			<ItemIcon id='decorative' />
			<ItemIcon id='conveying' label='Federated' />
		</>
	),
	play: async ({ canvasElement }) => {
		const menuItem = canvasElement.querySelector('#menu-item') as HTMLElement;
		// The ids are registered by the parts' effects, so the row names itself after the first render
		await waitFor(() => expect(menuItem).toHaveAttribute('aria-labelledby', 'menu-title'));
		await waitFor(() => expect(menuItem).toHaveAttribute('aria-describedby', 'status-icon'));

		const labelled = canvasElement.querySelector('#menu-labelled') as HTMLElement;
		await expect(labelled).toHaveAttribute('aria-labelledby', 'custom');
		await expect(labelled).toHaveAttribute('aria-describedby', 'extra');

		const plain = canvasElement.querySelector('#plain-row') as HTMLElement;
		await expect(plain).not.toHaveAttribute('aria-labelledby');

		await waitFor(() => expect(canvasElement.querySelector('#linked-link')).toHaveAttribute('aria-describedby', 'mine away-icon'));

		await waitFor(() => expect(canvasElement.querySelector('#titled')).toHaveAttribute('aria-labelledby', 'group-title'));
		await expect(canvasElement.querySelector('#own-label')).not.toHaveAttribute('aria-labelledby');

		const decorative = canvasElement.querySelector('#decorative') as HTMLElement;
		await expect(decorative).toHaveAttribute('aria-hidden', 'true');
		await expect(decorative).not.toHaveAttribute('role');
		const conveying = canvasElement.querySelector('#conveying') as HTMLElement;
		await expect(conveying).toHaveAttribute('role', 'img');
		await expect(conveying).toHaveAttribute('aria-label', 'Federated');
	},
};

export const GroupTitleElements: Story = {
	render: () => (
		<>
			<ItemGroupHeader>
				<ItemGroupTitle is='button' id='title-button' />
			</ItemGroupHeader>
			<ItemGroupHeader>
				<ItemGroupTitle is='button' id='title-submit' type='submit' />
			</ItemGroupHeader>
			<ItemGroupHeader>
				<ItemGroupTitle is='h3' id='title-heading'>
					Heading
				</ItemGroupTitle>
			</ItemGroupHeader>
		</>
	),
	play: async ({ canvasElement }) => {
		await expect(canvasElement.querySelector('#title-button')).toHaveAttribute('type', 'button');
		await expect(canvasElement.querySelector('#title-submit')).toHaveAttribute('type', 'submit');
		const heading = canvasElement.querySelector('#title-heading') as HTMLElement;
		await expect(heading.tagName).toBe('H3');
		await expect(heading).not.toHaveAttribute('type');
	},
};

export const Skeleton: Story = {
	render: () => (
		<>
			<ItemSkeleton />
			<ItemSkeleton description mediaSize='x36' inset='md' />
		</>
	),
	play: async ({ canvasElement }) => {
		const [first, second] = [...canvasElement.querySelectorAll('.rcx-item')];
		await expect(first).toHaveAttribute('aria-hidden', 'true');
		await expect(first.querySelector('.rcx-item__description')).toBeNull();
		await expect(second.querySelector('.rcx-item__description')).not.toBeNull();
		await expect(second).toHaveClass('rcx-item--inset-md');
	},
};

const onAction = fn();
const onTitle = fn();
const onLink = fn((event: MouseEvent) => event.preventDefault());

export const Keyboard: Story = {
	render: () => (
		<>
			<ItemGroupHeader>
				<ItemGroupTitle is='button' onClick={onTitle} id='collapse'>
					Favorites
				</ItemGroupTitle>
			</ItemGroupHeader>
			<Item>
				<ItemContent>
					<ItemTitle>
						<ItemLink href='#room' id='room-link' onClick={onLink}>
							Room
						</ItemLink>
					</ItemTitle>
				</ItemContent>
				<ItemActions reveal='hover'>
					<IconButton size='mini' icon='kebab' aria-label='Options' id='first-action' onClick={onAction} />
					<IconButton size='mini' icon='phone' aria-label='Call' id='second-action' />
				</ItemActions>
			</Item>
		</>
	),
	play: async ({ canvasElement }) => {
		await expectKeyboardActivation(canvasElement.querySelector('#collapse') as HTMLElement, onTitle);
		await expectKeyboardActivation(canvasElement.querySelector('#first-action') as HTMLElement, onAction);
		await expectTabOrder(
			['#collapse', '#room-link', '#first-action', '#second-action'].map((selector) => canvasElement.querySelector(selector) as HTMLElement),
		);
		await userEvent.keyboard('{Enter}');
	},
};

export const ActionsStructure: Story = {
	render: () => (
		<>
			<Item>
				<ItemActions id='always'>
					<IconButton size='mini' icon='kebab' aria-label='Always' />
				</ItemActions>
			</Item>
			<Item>
				<ItemActions id='hover' reveal='hover'>
					<IconButton size='mini' icon='kebab' aria-label='Hover' />
				</ItemActions>
			</Item>
		</>
	),
	play: async ({ canvasElement }) => {
		const always = canvasElement.querySelector('#always') as HTMLElement;
		await expect(always).toHaveClass('rcx-item__actions');
		await expect(always).not.toHaveClass('rcx-item__actions--reveal-hover');
		await expect(always.querySelector('.rcx-item__actions-inner')).toBeNull();
		const hover = canvasElement.querySelector('#hover') as HTMLElement;
		await expect(hover).toHaveClass('rcx-item__actions--reveal-hover');
		await expect(hover.querySelector(':scope > .rcx-item__actions-inner > button')).not.toBeNull();
	},
};

export const DragHandle: Story = {
	render: () => (
		<Item>
			<ItemDragHandle id='enabled-handle' />
			<ItemDragHandle id='disabled-handle' disabled />
			<ItemDragHandle id='aria-handle' aria-hidden='false' />
		</Item>
	),
	play: async ({ canvasElement }) => {
		const enabled = canvasElement.querySelector('#enabled-handle') as HTMLElement;
		await expect(enabled).toHaveAttribute('aria-hidden', 'true');
		await expect(enabled.tagName).toBe('SPAN');
		await expect(enabled.querySelector('svg')).not.toBeNull();
		await expect(canvasElement.querySelector('#disabled-handle')).toHaveClass('rcx-item__drag-handle--disabled');
		await expect(canvasElement.querySelector('#aria-handle')).toHaveAttribute('aria-hidden', 'false');
	},
};

export const Variations: Story = {
	render: () => (
		<>
			<Item id='all-off' />
			<Item id='flags' inset='sm' align='start' hoverable interactive multiline selected highlighted focused />
			<Item id='focus-managed' focusVisible={false} inset='md' />
			<Item id='focus-visible' focusVisible inset='lg' />
			<Item id='disabled-danger' disabled variant='danger' />
			<Item id='drag' grabbable dragging dropped />
			<Item id='drop-before' dropIndicator='before' dropDisabled />
			<Item id='drop-after' dropIndicator='after' dropTarget='available' />
			<Item id='drop-active' dropTarget='active' onClick={fn()} />
			<ItemGroup id='group-flags' dragging dropTarget='active' dropIndicator='before' dropDisabled dropped />
			<ItemGroupHeader id='header-flags' inset='lg' sticky />
			<ItemDivider id='divider-inset' inset='md' />
			<ItemDropSlot id='slot-available' dropTarget='available' />
			<ItemDropSlot id='slot-active' dropTarget='active' />
			<ItemMedia id='media-icon' variant='icon' />
			<ItemDescription id='desc-inline' inline truncate={false} size='large' />
			<ItemTitle id='title-wrap' truncate={false} />
			<ItemMeta id='meta-truncate' truncate />
			<ItemActions id='actions-hover' reveal='hover' />
			<ItemLink id='link-a' href='#'>
				a
			</ItemLink>
			<ItemLink id='link-b' is='button'>
				b
			</ItemLink>
		</>
	),
	play: async ({ canvasElement }) => {
		const expected = [
			'root > div[0]: rcx-item',
			'root > div[1]: rcx-item rcx-item--align-start rcx-item--focused rcx-item--highlighted rcx-item--hoverable rcx-item--inset-sm rcx-item--interactive rcx-item--multiline rcx-item--selected',
			'root > div[2]: rcx-item rcx-item--focus-managed rcx-item--inset-md',
			'root > div[3]: rcx-item rcx-item--focus-managed rcx-item--focus-visible rcx-item--inset-lg',
			'root > div[4]: rcx-item rcx-item--danger rcx-item--disabled',
			'root > div[5]: rcx-item rcx-item--dragging rcx-item--dropped rcx-item--grabbable',
			'root > div[6]: rcx-item rcx-item--drop-before rcx-item--drop-disabled',
			'root > div[7]: rcx-item rcx-item--drop-after rcx-item--drop-target-available',
			'root > div[8]: rcx-item rcx-item--clickable rcx-item--drop-target-active',
			'root > div[9]: rcx-item-group rcx-item-group--drop-before rcx-item-group--drop-disabled rcx-item-group--drop-target-active rcx-item-group--dragging rcx-item-group--dropped',
			'root > div[10]: rcx-item-group-header rcx-item-group-header--inset-lg rcx-item-group-header--sticky',
			'root > div[11]: rcx-item-divider rcx-item-divider--inset-md',
			'root > div[12]: rcx-item-drop-slot rcx-item-drop-slot--drop-target-available',
			'root > div[13]: rcx-item-drop-slot rcx-item-drop-slot--drop-target-active',
			'root > div[14]: rcx-item__media rcx-item__media--icon',
			'root > span: rcx-item__description rcx-item__description--inline rcx-item__description--large rcx-item__description--wrap',
			'root > div[15]: rcx-item__title rcx-item__title--wrap',
			'root > div[16]: rcx-item__meta rcx-item__meta--truncate',
			'root > div[17]: rcx-item__actions rcx-item__actions--reveal-hover',
			'root > a: rcx-item__link',
			'root > button: rcx-item__link',
		];
		const contract = classContract(canvasElement).split('\n');
		const normalize = (line: string) => {
			const [path, classes] = line.split(': ');
			return `${path}: ${classes.split(' ').sort().join(' ')}`;
		};
		const wanted = expected.map(normalize);
		const found = contract.filter((line) => !line.includes('rcx-item__actions-inner')).map(normalize);
		await expect(found.length).toBe(wanted.length);
		await expect(found).toEqual(wanted);
	},
};

/** A virtualizer positions its rows through `style` and `data-*` on the list and on each row, and the rows must keep it. */
export const VirtualizerProps: Story = {
	render: () => (
		<ItemGroup
			id='virtual-list'
			role='list'
			data-testid='virtuoso-item-list'
			style={{ boxSizing: 'border-box', marginTop: 0, paddingTop: 120, paddingBottom: 40, visibility: 'visible' }}
		>
			<Item id='virtual-row' is='div' role='listitem' data-index={3} data-known-size='44' data-item-index='3' />
		</ItemGroup>
	),
	play: async ({ canvasElement }) => {
		const list = canvasElement.querySelector('#virtual-list') as HTMLElement;
		await expect(list).toHaveAttribute('data-testid', 'virtuoso-item-list');
		await expect(list.style.boxSizing).toBe('border-box');
		await expect(list.style.marginTop).toBe('0px');
		await expect(list.style.paddingTop).toBe('120px');
		await expect(list.style.paddingBottom).toBe('40px');
		await expect(list.style.visibility).toBe('visible');
		const row = canvasElement.querySelector('#virtual-row') as HTMLElement;
		await expect(row).toHaveAttribute('data-index', '3');
		await expect(row).toHaveAttribute('data-known-size', '44');
		await expect(row).toHaveAttribute('data-item-index', '3');
	},
};

export const GroupDimsWhileDragged: Story = {
	render: () => (
		<>
			<ItemGroup id='group-dragged' dragging />
			<ItemGroup id='group-resting' />
			<Item id='row-dragged' dragging />
		</>
	),
	play: async ({ canvasElement }) => {
		const opacity = (id: string) => getComputedStyle(canvasElement.querySelector(id) as Element).opacity;
		await expect(canvasElement.querySelector('#group-dragged')).toHaveClass('rcx-item-group--dragging');
		// jsdom loads no stylesheet
		if (navigator.userAgent.includes('jsdom')) return;
		await expect(opacity('#group-dragged')).toBe('0.4');
		await expect(opacity('#row-dragged')).toBe('0.4');
		await expect(opacity('#group-resting')).toBe('1');
	},
};

/** Focus is re-found through the first `rcx-*` class of the focused element, so a part's own class must be the first of them. */
export const FirstClassIsOwn: Story = {
	render: () => (
		<Item id='first-row'>
			<ItemContent>
				<ItemTitle>
					<ItemLink id='first-link' href='#link' onClick={(e) => e.preventDefault()}>
						Name
					</ItemLink>
				</ItemTitle>
			</ItemContent>
		</Item>
	),
	play: async ({ canvasElement }) => {
		const firstOwn = (id: string) =>
			Array.from((canvasElement.querySelector(id) as HTMLElement).classList).find((name) => name.startsWith('rcx-'));
		await expect(firstOwn('#first-row')).toBe('rcx-item');
		await expect(firstOwn('#first-link')).toBe('rcx-item__link');
	},
};

export const AccessibilityTree: Story = {
	render: () => (
		<ItemGroup is='ul' aria-label='Rooms'>
			<ItemGroupHeader is='li' aria-hidden>
				<ItemGroupTitle>Favorites</ItemGroupTitle>
			</ItemGroupHeader>
			<Item is='li' selected>
				<ItemMedia>
					<span aria-hidden>avatar</span>
				</ItemMedia>
				<ItemIcon label='Team' />
				<ItemContent>
					<ItemRow>
						<ItemTitle>
							<ItemLink href='#design'>design-system</ItemLink>
						</ItemTitle>
						<ItemMeta>10:42</ItemMeta>
					</ItemRow>
					<ItemDescription>Last message</ItemDescription>
				</ItemContent>
				<ItemActions reveal='hover'>
					<IconButton size='mini' icon='kebab' aria-label='Options' />
				</ItemActions>
			</Item>
			<ItemDivider is='li' aria-hidden />
			<Item is='li' disabled>
				<ItemContent>
					<ItemTitle>Disabled</ItemTitle>
				</ItemContent>
			</Item>
		</ItemGroup>
	),
	play: async ({ canvasElement }) => {
		await expect(ariaSnapshot(canvasElement)).toBe(
			[
				'- list "Rooms":',
				'  - listitem:',
				'    - img "Team"',
				'    - link "design-system"',
				'    - text: "10:42"',
				'    - text: "Last message"',
				'    - button "Options"',
				'  - listitem:',
				'    - text: "Disabled"',
			].join('\n'),
		);
	},
};

export const TitleAsLabel: Story = {
	render: () => (
		<Item>
			<ItemContent>
				<ItemTitle is='label' htmlFor='row-check' id='label-title'>
					Notify me
				</ItemTitle>
			</ItemContent>
			<ItemActions>
				<input id='row-check' type='checkbox' />
			</ItemActions>
		</Item>
	),
	play: async ({ canvasElement }) => {
		const title = canvasElement.querySelector('#label-title') as HTMLElement;
		await expect(title.tagName).toBe('LABEL');
		await expect(title).toHaveAttribute('for', 'row-check');
		await expect(title).toHaveClass('rcx-item__title');
		await expect(canvasElement.querySelector('#row-check')).toHaveAccessibleName('Notify me');
	},
};
