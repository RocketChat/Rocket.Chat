import { composeStories } from '@storybook/react-webpack5';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import * as stories from './Menu.stories';
import { withResizeObserverMock } from '../../../mocks/withResizeObserverMock';
import { render } from '../../testing';

withResizeObserverMock();

const { Simple, Complex, WithSections, WithSubmenu, WithRichSubmenuTrigger, WithItemParts, WithItemAliases } = composeStories(stories);

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

describe('[Menu Component]', () => {
	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { container } = render(<Story />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	describe('Interaction', () => {
		it('should display all menu items when opened', async () => {
			render(<Simple {...Simple.args} />);

			const button = screen.getByRole('button');
			await userEvent.click(button);

			await waitFor(() => {
				expect(screen.getByRole('menuitem', { name: 'Profile' })).toBeInTheDocument();
				expect(screen.getByRole('menuitem', { name: 'Chats' })).toBeInTheDocument();
				expect(screen.getByRole('menuitem', { name: 'Settings' })).toBeInTheDocument();
			});
		});

		it('should display menu items with icons', async () => {
			render(<Complex {...Complex.args} />);

			const button = screen.getByRole('button');
			await userEvent.click(button);

			const menuitem = screen.getByRole('menuitem', { name: 'Profile' });
			expect(menuitem).toBeInTheDocument();

			await waitFor(() => {
				expect(menuitem.querySelector('i')).toBeInTheDocument();
			});
		});

		it('should display menu sections with titles', async () => {
			render(<WithSections {...WithSections.args} />);

			const button = screen.getByRole('button');
			await userEvent.click(button);

			await waitFor(() => {
				expect(screen.getByRole('group', { name: 'Styles' })).toBeInTheDocument();
				expect(screen.getByRole('menuitem', { name: 'Bold' })).toBeInTheDocument();
				expect(screen.getByRole('menuitem', { name: 'Underline' })).toBeInTheDocument();
			});
		});

		it('should close menu when clicked twice', async () => {
			render(<Simple {...Simple.args} />);

			const button = screen.getByRole('button');
			await userEvent.click(button);

			await waitFor(() => {
				expect(screen.getByRole('menuitem', { name: 'Profile' })).toBeInTheDocument();
			});

			await userEvent.click(button);

			expect(screen.queryByRole('menuitem', { name: 'Profile' })).not.toBeInTheDocument();
		});

		it('should close menu when clicking outside', async () => {
			render(<Simple {...Simple.args} />);

			const button = screen.getByRole('button');
			await userEvent.click(button);

			await waitFor(() => {
				expect(screen.getByRole('menuitem', { name: 'Profile' })).toBeInTheDocument();
			});

			await userEvent.click(document.body);

			expect(screen.queryByRole('menuitem', { name: 'Profile' })).not.toBeInTheDocument();
		});

		it('should close menu when selecting a menu item', async () => {
			render(<Simple {...Simple.args} />);

			const button = screen.getByRole('button');
			await userEvent.click(button);

			await waitFor(() => {
				expect(screen.getByRole('menuitem', { name: 'Profile' })).toBeInTheDocument();
			});

			const profileItem = screen.getByRole('menuitem', { name: 'Profile' });
			await userEvent.click(profileItem);

			expect(screen.queryByRole('menuitem', { name: 'Profile' })).not.toBeInTheDocument();
		});
	});

	describe('Item parts', () => {
		it('should render menu items and submenu triggers as Item rows', async () => {
			render(<WithItemParts {...WithItemParts.args} />);

			await userEvent.click(screen.getByRole('button'));

			const items = await screen.findAllByRole('menuitem');
			expect(items).toHaveLength(4);
			items.forEach((item) => expect(item).toHaveClass('rcx-item'));
		});

		it('should render the MenuItem* aliases as Item slots named by their content', async () => {
			render(<WithItemAliases {...WithItemAliases.args} />);

			await userEvent.click(screen.getByRole('button'));

			const notifications = await screen.findByRole('menuitem', {
				name: 'Notifications',
			});
			const slots = Array.from(notifications.children).map((child) => child.className);
			expect(slots).toEqual([
				expect.stringContaining('rcx-item__icon'),
				expect.stringContaining('rcx-item__content'),
				expect.stringContaining('rcx-item__actions'),
			]);
			expect(screen.getByRole('menuitem', { name: 'Logout' }).firstElementChild).toHaveClass('rcx-item__media', 'rcx-option__column');
		});

		it('should name a menu item by its title and describe it with its labelled ItemIcon', async () => {
			render(<WithItemParts {...WithItemParts.args} />);

			await userEvent.click(screen.getByRole('button'));

			const online = await screen.findByRole('menuitem', { name: 'Online' });
			const icon = screen.getByRole('img', { name: 'Selected' });
			expect(online).toHaveAttribute('aria-describedby', icon.id);
			expect(screen.getByRole('menuitem', { name: 'Away' })).toHaveAccessibleDescription('');
		});

		it('should show the focus ring only for keyboard focus', async () => {
			const user = userEvent.setup();
			render(<WithItemParts {...WithItemParts.args} />);

			await user.click(screen.getByRole('button'));

			const away = await screen.findByRole('menuitem', { name: 'Away' });
			await user.hover(away);
			await waitFor(() => expect(away).toHaveClass('rcx-item--focused'));
			expect(away).not.toHaveClass('rcx-item--focus-visible');

			await user.keyboard('{ArrowDown}');
			const notifications = screen.getByRole('menuitem', {
				name: 'Notifications',
			});
			await waitFor(() => expect(notifications).toHaveClass('rcx-item--focus-visible'));
		});

		it('should name each section group by its title', async () => {
			render(<WithItemParts {...WithItemParts.args} />);

			await userEvent.click(screen.getByRole('button'));

			expect(await screen.findByRole('group', { name: 'Status' })).toBeInTheDocument();
			expect(screen.getByRole('group', { name: 'Preferences' })).toBeInTheDocument();
		});
	});

	describe('Submenu', () => {
		it('should mark a title-based submenu trigger with aria-haspopup', async () => {
			render(<WithSubmenu {...WithSubmenu.args} />);

			await userEvent.click(screen.getByRole('button'));

			const trigger = await screen.findByRole('menuitem', { name: 'Share' });
			expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
			expect(trigger).toHaveAttribute('aria-expanded', 'false');

			// sibling leaf items stay regular menu items
			expect(screen.getByRole('menuitem', { name: 'Profile' })).not.toHaveAttribute('aria-haspopup');
		});

		it('should build a rich MenuSubmenuTrigger from its first child and mark it as a submenu', async () => {
			render(<WithRichSubmenuTrigger {...WithRichSubmenuTrigger.args} />);

			await userEvent.click(screen.getByRole('button'));

			// the first child of MenuSubmenuTrigger becomes the trigger, rendered with
			// its rich content (icon) and flagged as opening a submenu...
			const triggers = (await screen.findAllByRole('menuitem')).filter((item) => item.getAttribute('aria-haspopup') === 'menu');
			expect(triggers).toHaveLength(1);
			const [trigger] = triggers;
			expect(trigger).toHaveTextContent('Move to');
			expect(trigger.querySelector('i')).toBeInTheDocument();

			// ...while the remaining children are NOT rendered as items of the parent menu
			expect(screen.queryByRole('menuitem', { name: 'Inbox' })).not.toBeInTheDocument();
		});

		it('should close nested submenus one level at a time when navigating back, keeping the root open', async () => {
			const user = userEvent.setup();
			render(<WithRichSubmenuTrigger {...WithRichSubmenuTrigger.args} />);

			await user.click(screen.getByRole('button'));
			await screen.findAllByRole('menuitem');

			// open the first level submenu ("Move to") then the nested one ("Teams")
			await user.keyboard('{ArrowDown}{ArrowDown}{ArrowRight}');
			expect(await screen.findByText('Inbox')).toBeInTheDocument();
			await user.keyboard('{ArrowDown}{ArrowDown}{ArrowRight}');
			expect(await screen.findByText('Design')).toBeInTheDocument();

			// going back closes only the nested submenu — level 1 and the root survive
			await user.keyboard('{ArrowLeft}');
			await waitFor(() => expect(screen.queryByText('Design')).not.toBeInTheDocument());
			expect(screen.getByText('Inbox')).toBeInTheDocument();
			expect(screen.getByText('New')).toBeInTheDocument();

			// going back again closes level 1 — the root menu is still open
			await user.keyboard('{ArrowLeft}');
			await waitFor(() => expect(screen.queryByText('Inbox')).not.toBeInTheDocument());
			expect(screen.getByText('New')).toBeInTheDocument();
		});

		it('should close the latest open submenu on Escape, one level at a time, keeping ancestors open', async () => {
			const user = userEvent.setup();
			render(<WithRichSubmenuTrigger {...WithRichSubmenuTrigger.args} />);

			await user.click(screen.getByRole('button'));
			await screen.findAllByRole('menuitem');

			// open the first level submenu ("Move to") then the nested one ("Teams")
			await user.keyboard('{ArrowDown}{ArrowDown}{ArrowRight}');
			expect(await screen.findByText('Inbox')).toBeInTheDocument();
			await user.keyboard('{ArrowDown}{ArrowDown}{ArrowRight}');
			expect(await screen.findByText('Design')).toBeInTheDocument();

			// Escape closes only the nested submenu — level 1 and the root survive
			await user.keyboard('{Escape}');
			await waitFor(() => expect(screen.queryByText('Design')).not.toBeInTheDocument());
			expect(screen.getByText('Inbox')).toBeInTheDocument();
			expect(screen.getByText('New')).toBeInTheDocument();

			// Escape again closes level 1 — the root menu is still open
			await user.keyboard('{Escape}');
			await waitFor(() => expect(screen.queryByText('Inbox')).not.toBeInTheDocument());
			expect(screen.getByText('New')).toBeInTheDocument();

			// a final Escape closes the root menu
			await user.keyboard('{Escape}');
			await waitFor(() => expect(screen.queryByText('New')).not.toBeInTheDocument());
		});

		it('should close a hover-opened submenu on Escape without closing the root menu', async () => {
			const user = userEvent.setup();
			render(<WithRichSubmenuTrigger {...WithRichSubmenuTrigger.args} />);

			await user.click(screen.getByRole('button'));
			await screen.findAllByRole('menuitem');

			// open the submenu by hovering its trigger — focus stays on the trigger
			const trigger = (await screen.findAllByRole('menuitem')).find((item) => item.getAttribute('aria-haspopup') === 'menu');
			await user.hover(trigger!);
			expect(await screen.findByText('Inbox')).toBeInTheDocument();

			// Escape closes only the submenu — the root menu stays open
			await user.keyboard('{Escape}');
			await waitFor(() => expect(screen.queryByText('Inbox')).not.toBeInTheDocument());
			expect(screen.getByText('New')).toBeInTheDocument();

			// a second Escape closes the root menu
			await user.keyboard('{Escape}');
			await waitFor(() => expect(screen.queryByText('New')).not.toBeInTheDocument());
		});

		it('should close the entire menu when interacting outside while a submenu is open', async () => {
			const user = userEvent.setup();
			render(
				<div>
					{/* a non-focusable target: closing must not depend on a blur event */}
					<div data-testid='outside'>outside</div>
					<WithRichSubmenuTrigger {...WithRichSubmenuTrigger.args} />
				</div>,
			);

			await user.click(screen.getByRole('button'));
			await screen.findAllByRole('menuitem');

			// open a submenu so it becomes the topmost overlay
			await user.keyboard('{ArrowDown}{ArrowDown}{ArrowRight}');
			expect(await screen.findByText('Inbox')).toBeInTheDocument();

			await user.click(screen.getByTestId('outside'));

			// both the submenu and the root menu close
			await waitFor(() => expect(screen.queryByText('Inbox')).not.toBeInTheDocument());
			expect(screen.queryByText('New')).not.toBeInTheDocument();
		});
	});

	describe('Sizing', () => {
		it('should apply small size by default', () => {
			render(<Simple {...Simple.args} />);

			const button = screen.getByRole('button');
			expect(button).toHaveClass('rcx-button--small-square');
		});

		it('should accept large size prop', () => {
			render(<Simple {...Simple.args} large />);

			const button = screen.getByRole('button');
			expect(button).toHaveClass('rcx-button--large-square');
		});

		it('should accept medium size prop', () => {
			render(<Simple {...Simple.args} medium />);

			const button = screen.getByRole('button');
			expect(button).toHaveClass('rcx-button--medium-square');
		});

		it('should accept tiny size prop', () => {
			render(<Simple {...Simple.args} tiny />);

			const button = screen.getByRole('button');
			expect(button).toHaveClass('rcx-button--tiny-square');
		});

		it('should accept mini size prop', () => {
			render(<Simple {...Simple.args} mini />);

			const button = screen.getByRole('button');
			expect(button).toHaveClass('rcx-button--mini-square');
		});
	});
});
