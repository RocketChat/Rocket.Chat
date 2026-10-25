import { composeStories } from '@storybook/react-webpack5';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { createRef } from 'react';

import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemDivider,
	ItemGroup,
	ItemGroupHeader,
	ItemGroupTitle,
	ItemIcon,
	ItemLink,
	ItemMedia,
	ItemMeta,
	ItemSkeleton,
	ItemTitle,
} from '.';
import * as stories from './Item.stories';
import { render } from '../../testing';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

describe('[Item Rendering]', () => {
	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { container } = render(<Story />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});

describe('Item', () => {
	it('renders a div with no inset', () => {
		render(<Item data-testid='item' />);

		const item = screen.getByTestId('item');
		expect(item.tagName).toBe('DIV');
		expect(item).toHaveClass('rcx-item');
		expect(item.className).not.toMatch(/--inset-/);
	});

	it('renders the element passed to `is`', () => {
		render(
			<ul>
				<Item is='li' data-testid='item' />
			</ul>,
		);

		expect(screen.getByTestId('item').tagName).toBe('LI');
	});

	it.each([
		[{ inset: 'lg' as const }, 'rcx-item--inset-lg'],
		[{ selected: true }, 'rcx-item--selected'],
		[{ highlighted: true }, 'rcx-item--highlighted'],
		[{ focused: true }, 'rcx-item--focused'],
		[{ disabled: true }, 'rcx-item--disabled'],
		[{ variant: 'danger' as const }, 'rcx-item--danger'],
	])('maps %o to the %s modifier', (props, className) => {
		render(<Item {...props} data-testid='item' />);

		expect(screen.getByTestId('item')).toHaveClass(className);
	});

	it('keeps a custom className', () => {
		render(<Item className='custom' data-testid='item' />);

		expect(screen.getByTestId('item')).toHaveClass('rcx-item', 'custom');
	});

	it('forwards its ref', () => {
		const ref = createRef<HTMLElement>();
		render(<Item ref={ref} data-testid='item' />);

		expect(ref.current).toBe(screen.getByTestId('item'));
	});

	it('calls onClick and marks the row clickable', async () => {
		const onClick = jest.fn();
		render(
			<Item onClick={onClick} data-testid='item'>
				<ItemTitle>Row</ItemTitle>
			</Item>,
		);

		await userEvent.click(screen.getByText('Row'));

		expect(onClick).toHaveBeenCalledTimes(1);
		expect(screen.getByTestId('item')).toHaveClass('rcx-item--clickable');
	});

	it('aligns slots to the start and shows the hover surface on request', () => {
		render(<Item align='start' hoverable data-testid='item' />);

		expect(screen.getByTestId('item')).toHaveClass('rcx-item--align-start', 'rcx-item--hoverable');
	});

	it('ignores clicks while disabled', async () => {
		const onClick = jest.fn();
		render(
			<Item onClick={onClick} disabled>
				<ItemTitle>Row</ItemTitle>
			</Item>,
		);

		await userEvent.click(screen.getByText('Row'));

		expect(onClick).not.toHaveBeenCalled();
	});

	it('does not set a role or ARIA state on its own', () => {
		render(<Item selected disabled data-testid='item' />);

		const item = screen.getByTestId('item');
		expect(item).not.toHaveAttribute('role');
		expect(item).not.toHaveAttribute('aria-selected');
		expect(item).not.toHaveAttribute('aria-disabled');
	});
});

describe('ItemLink', () => {
	it('renders an anchor by default', () => {
		render(
			<Item>
				<ItemLink href='#general'>general</ItemLink>
			</Item>,
		);

		expect(screen.getByRole('link', { name: 'general' })).toHaveAttribute('href', '#general');
	});

	it('renders a button of type button with `is="button"`', async () => {
		const onClick = jest.fn();
		render(
			<Item>
				<ItemLink is='button' onClick={onClick}>
					Kenji Takahashi
				</ItemLink>
			</Item>,
		);

		const button = screen.getByRole('button', { name: 'Kenji Takahashi' });
		expect(button).toHaveAttribute('type', 'button');

		await userEvent.click(button);
		expect(onClick).toHaveBeenCalledTimes(1);
	});

	it('is described by the labelled icons of its row', () => {
		render(
			<Item>
				<ItemIcon label='Away' />
				<ItemTitle>
					<ItemLink href='#kenji'>Kenji Takahashi</ItemLink>
				</ItemTitle>
			</Item>,
		);

		const icon = screen.getByRole('img', { name: 'Away' });
		expect(screen.getByRole('link', { name: 'Kenji Takahashi' })).toHaveAttribute('aria-describedby', icon.id);
	});

	it('keeps its own description alongside the icon label', () => {
		render(
			<Item>
				<ItemIcon label='Private channel' />
				<ItemTitle>
					<ItemLink href='#ops' aria-describedby='hint'>
						ops-oncall
					</ItemLink>
				</ItemTitle>
				<span id='hint'>3 unread messages</span>
			</Item>,
		);

		const icon = screen.getByRole('img', { name: 'Private channel' });
		expect(screen.getByRole('link', { name: 'ops-oncall' })).toHaveAttribute('aria-describedby', `hint ${icon.id}`);
	});

	it('is not described by a decorative icon', () => {
		render(
			<Item>
				<ItemIcon />
				<ItemTitle>
					<ItemLink href='#general'>general</ItemLink>
				</ItemTitle>
			</Item>,
		);

		expect(screen.getByRole('link', { name: 'general' })).not.toHaveAttribute('aria-describedby');
	});
});

describe('ItemIcon', () => {
	it('exposes its label as an image', () => {
		render(<ItemIcon label='Team' />);

		expect(screen.getByRole('img', { name: 'Team' })).toBeInTheDocument();
	});

	it('is hidden from assistive technology without a label', () => {
		render(<ItemIcon data-testid='icon' />);

		expect(screen.getByTestId('icon')).toHaveAttribute('aria-hidden', 'true');
	});
});

describe('ItemGroup', () => {
	it('is labelled by the title of its header', () => {
		render(
			<ItemGroup is='ul'>
				<ItemGroupHeader is='li' aria-hidden>
					<ItemGroupTitle>Moderators</ItemGroupTitle>
				</ItemGroupHeader>
				<Item is='li'>Gabriel</Item>
			</ItemGroup>,
		);

		expect(screen.getByRole('list', { name: 'Moderators' })).toBeInTheDocument();
	});

	it('keeps a label passed by the consumer', () => {
		render(
			<ItemGroup is='ul' aria-label='All members'>
				<ItemGroupHeader is='li' aria-hidden>
					<ItemGroupTitle>Moderators</ItemGroupTitle>
				</ItemGroupHeader>
			</ItemGroup>,
		);

		expect(screen.getByRole('list', { name: 'All members' })).toBeInTheDocument();
	});

	it('has no label without a title', () => {
		render(<ItemGroup is='ul' data-testid='group' />);

		expect(screen.getByTestId('group')).not.toHaveAttribute('aria-labelledby');
	});
});

describe('ItemGroupHeader', () => {
	it('maps inset and sticky to modifiers', () => {
		render(<ItemGroupHeader inset='lg' sticky data-testid='header' />);

		expect(screen.getByTestId('header')).toHaveClass('rcx-item-group-header--inset-lg', 'rcx-item-group-header--sticky');
	});
});

describe('ItemGroupTitle', () => {
	it('renders a button of type button when collapsible', () => {
		render(
			<ItemGroupTitle is='button' aria-expanded>
				Favorites
			</ItemGroupTitle>,
		);

		expect(screen.getByRole('button', { name: 'Favorites' })).toHaveAttribute('type', 'button');
	});

	it('does not set a type on other elements', () => {
		render(<ItemGroupTitle is='h3'>Favorites</ItemGroupTitle>);

		expect(screen.getByRole('heading', { name: 'Favorites' })).not.toHaveAttribute('type');
	});
});

describe('ItemActions', () => {
	it('wraps its children for the hover reveal', () => {
		render(
			<ItemActions reveal='hover' data-testid='actions'>
				<button type='button'>Options</button>
			</ItemActions>,
		);

		const actions = screen.getByTestId('actions');
		expect(actions).toHaveClass('rcx-item__actions--reveal-hover');
		expect(actions.firstElementChild).toHaveClass('rcx-item__actions-inner');
	});

	it('keeps hidden actions reachable with the keyboard', async () => {
		render(
			<Item>
				<ItemTitle>
					<ItemLink href='#general'>general</ItemLink>
				</ItemTitle>
				<ItemActions reveal='hover'>
					<button type='button'>Options</button>
				</ItemActions>
			</Item>,
		);

		await userEvent.tab();
		expect(screen.getByRole('link', { name: 'general' })).toHaveFocus();

		await userEvent.tab();
		expect(screen.getByRole('button', { name: 'Options' })).toHaveFocus();
	});
});

describe('ItemDescription', () => {
	it('renders a span when inline, so it can sit inside a button', () => {
		render(<ItemDescription inline>@kenji</ItemDescription>);

		expect(screen.getByText('@kenji').tagName).toBe('SPAN');
		expect(screen.getByText('@kenji')).toHaveClass('rcx-item__description--inline');
	});
});

describe('ItemMeta', () => {
	it('does not truncate by default', () => {
		render(<ItemMeta>10:42</ItemMeta>);

		expect(screen.getByText('10:42')).toHaveClass('rcx-item__meta');
		expect(screen.getByText('10:42')).not.toHaveClass('rcx-item__meta--truncate');
	});

	it('truncates when `truncate` is set', () => {
		render(<ItemMeta truncate>Invite one user to join this channel</ItemMeta>);

		expect(screen.getByText('Invite one user to join this channel')).toHaveClass('rcx-item__meta--truncate');
	});
});

describe('ItemMedia', () => {
	it('keeps the icon box with `variant="icon"`', () => {
		render(<ItemMedia variant='icon' data-testid='media' />);

		expect(screen.getByTestId('media')).toHaveClass('rcx-item__media--icon');
	});
});

describe('ItemDivider', () => {
	it('renders without a role unless one is passed', () => {
		render(
			<>
				<ItemDivider data-testid='plain' />
				<ItemDivider role='separator' inset='md' />
			</>,
		);

		expect(screen.getByTestId('plain')).not.toHaveAttribute('role');
		expect(screen.getByRole('separator')).toHaveClass('rcx-item-divider--inset-md');
	});
});

describe('ItemSkeleton', () => {
	it('adds a description line and stays hidden from assistive technology', () => {
		const { container } = render(<ItemSkeleton mediaSize='x36' description />);

		const item = container.firstElementChild;
		expect(item).toHaveClass('rcx-item');
		expect(item).toHaveAttribute('aria-hidden', 'true');
		expect(container.querySelectorAll('.rcx-skeleton')).toHaveLength(3);
	});

	it('shows one text line by default', () => {
		const { container } = render(<ItemSkeleton />);

		expect(container.querySelectorAll('.rcx-skeleton')).toHaveLength(2);
	});
});

describe('ItemContent', () => {
	it('renders the content slot', () => {
		render(<ItemContent data-testid='content' />);

		expect(screen.getByTestId('content')).toHaveClass('rcx-item__content');
	});
});
