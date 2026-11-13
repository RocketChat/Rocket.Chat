import { composeStories } from '@storybook/react';
import { axe } from 'jest-axe';

import { render } from '../../testing';
import { Item, ItemContent, ItemTitle } from '../Item';
import Options from './Options';
import * as stories from './Options.stories';

const { Grouped } = composeStories(stories);

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story] as const);

describe('[Options Component]', () => {
	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { container } = render(<Story />);

		// The listbox takes its name from the input that owns it.
		const results = await axe(container, {
			rules: {
				'aria-input-field-name': { enabled: false },
			},
		});
		expect(results).toHaveNoViolations();
	});

	it('should render headings and dividers with `Item` group parts', () => {
		const { getByRole, getByText } = render(<Grouped />);

		const listbox = getByRole('listbox');
		expect(getByText('Recent').closest('li')).toHaveClass('rcx-item-group-header', 'rcx-option__header');
		expect(getByText('Recent').closest('li')).toHaveAttribute('role', 'presentation');
		expect(listbox.querySelector('li.rcx-item-divider')).toHaveAttribute('aria-hidden', 'true');
	});
});

describe('[Options]', () => {
	it.each([
		[false, 'false'],
		[true, 'true'],
	])('should set aria-multiselectable for multiple=%s', (multiple, expected) => {
		const { getByRole } = render(<Options options={[['a', 'A']]} cursor={0} multiple={multiple} onSelect={() => undefined} />);

		expect(getByRole('listbox')).toHaveAttribute('aria-multiselectable', expected);
	});

	it('should point aria-activedescendant at the id of the option under the cursor', () => {
		const { getByRole } = render(
			<Options
				options={[
					['heading', 'Group', undefined, undefined, 'heading'],
					['a', 'A'],
					['b', 'B'],
				]}
				cursor={2}
				onSelect={() => undefined}
			/>,
		);

		const activeId = getByRole('listbox').getAttribute('aria-activedescendant');
		expect(activeId).toBeTruthy();
		expect(getByRole('option', { name: 'B' })).toHaveAttribute('id', activeId);
	});

	it('should not set aria-activedescendant when the cursor is not on an option', () => {
		const { getByRole } = render(
			<Options options={[['heading', 'Group', undefined, undefined, 'heading']]} cursor={0} onSelect={() => undefined} />,
		);

		expect(getByRole('listbox')).not.toHaveAttribute('aria-activedescendant');
	});

	it('should scroll to the row focused by the cursor when it renders as `Item`', () => {
		const options = Array.from({ length: 10 }, (_, i) => [i, `Option ${i}`] as [number, string]);
		const offsetTop = jest.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(function (this: HTMLElement) {
			return Number(this.dataset.index ?? 0) * 40;
		});
		const clientHeight = jest.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function (this: HTMLElement) {
			return this.getAttribute('role') === 'listbox' ? 120 : 40;
		});

		const { getByRole } = render(
			<Options
				options={options}
				cursor={8}
				onSelect={() => undefined}
				renderItem={({ label, focus, value, selected, ...props }) => (
					<Item {...props} is='li' data-index={value} focused={focus} aria-selected={!!selected}>
						<ItemContent>
							<ItemTitle>{label}</ItemTitle>
						</ItemContent>
					</Item>
				)}
			/>,
		);

		expect(getByRole('listbox').scrollTop).toBe(320);

		offsetTop.mockRestore();
		clientHeight.mockRestore();
	});
	it('should scroll to the row focused by the cursor when a row renders more than one element', () => {
		const options = Array.from({ length: 10 }, (_, i) => [i, `Option ${i}`] as [number, string]);
		const offsetTop = jest.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(function (this: HTMLElement) {
			return Number(this.dataset.index ?? 0) * 40;
		});
		const clientHeight = jest.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function (this: HTMLElement) {
			return this.getAttribute('role') === 'listbox' ? 120 : 40;
		});

		const { getByRole } = render(
			<Options
				options={options}
				cursor={8}
				onSelect={() => undefined}
				renderItem={({ label, focus, value, selected, ...props }) => (
					<>
						{value === 0 && <li role='presentation'>Pinned</li>}
						<Item {...props} is='li' data-index={value} focused={focus} aria-selected={!!selected}>
							<ItemContent>
								<ItemTitle>{label}</ItemTitle>
							</ItemContent>
						</Item>
					</>
				)}
			/>,
		);

		expect(getByRole('listbox').scrollTop).toBe(320);

		offsetTop.mockRestore();
		clientHeight.mockRestore();
	});
});
