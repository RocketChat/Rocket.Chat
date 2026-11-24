import { composeStories } from '@storybook/react';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import CheckOption from './CheckOption';
import Option from './Option';
import * as stories from './Option.stories';
import OptionContent from './OptionContent';
import { prevent } from '../../helpers/prevent';
import { render } from '../../testing';

jest.mock('../../helpers/prevent');

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story] as const);

describe('Option', () => {
	it('renders without crashing', () => {
		render(
			<Option>
				<OptionContent>Lorem Ipsum Lorem</OptionContent>
			</Option>,
		);

		expect(screen.getByText('Lorem Ipsum Lorem')).toBeInTheDocument();
	});

	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { container } = render(<Story />);

		const rules = Object.fromEntries(
			(Story.parameters.a11y?.config?.rules ?? []).map(({ id, enabled }: { id: string; enabled: boolean }) => [id, { enabled }]),
		);
		const results = await axe(container, { rules });
		expect(results).toHaveNoViolations();
	});

	it('should render an `Item` row that keeps the `Option` classes, value and states', () => {
		render(<Option role='option' value='1' label='Lorem' focus selected />);

		const option = screen.getByRole('option', { name: 'Lorem' });

		expect(option.tagName).toBe('LI');
		expect(option).toHaveClass(
			'rcx-item',
			'rcx-item--focused',
			'rcx-item--selected',
			'rcx-option',
			'rcx-option--focus',
			'rcx-option--selected',
		);
		expect(option).toHaveAttribute('value', '1');
		expect(option).toHaveAttribute('aria-selected', 'true');
		expect(option).toHaveAttribute('aria-disabled', 'false');
		expect(option).not.toHaveAttribute('label');
	});

	it('should keep the `rcx-option__content` class on the label', () => {
		render(<Option label='Empty' />);

		// oxlint-disable-next-line testing-library/no-node-access -- the content wrapper has no role, label or text of its own
		expect(screen.getByText('Empty').closest('div.rcx-option__content')).not.toBe(null);
	});

	it('should name the icon with `iconLabel` and hide it otherwise', () => {
		const { rerender, container } = render(<Option label='rocket.cat' icon='globe' iconLabel='Federated' />);

		expect(screen.getByRole('img', { name: 'Federated' })).toBeInTheDocument();

		rerender(<Option label='rocket.cat' icon='globe' />);

		// oxlint-disable-next-line testing-library/no-container, testing-library/no-node-access -- a hidden icon has no role, label or text to query by
		expect(container.querySelector('.rcx-option__column')).toHaveAttribute('aria-hidden', 'true');
	});

	it('should call onClick when click', async () => {
		const user = userEvent.setup();
		const click = jest.fn();

		render(
			<Option onClick={click}>
				<OptionContent>Option</OptionContent>
			</Option>,
		);

		await user.click(screen.getByText('Option'));

		expect(click).toHaveBeenCalledTimes(1);
	});

	it('should call prevent when click on disabled', async () => {
		const user = userEvent.setup();
		const click = jest.fn();

		render(
			<Option disabled onClick={click}>
				<OptionContent>Option</OptionContent>
			</Option>,
		);

		await user.click(screen.getByText('Option'));

		expect(click).toHaveBeenCalledTimes(0);
		expect(prevent).toHaveBeenCalledTimes(1);
	});
});

describe('CheckOption', () => {
	it('should announce selection through `aria-selected` and hide the checkbox', () => {
		render(
			<CheckOption role='option' selected>
				Lorem
			</CheckOption>,
		);

		const option = screen.getByRole('option', { name: 'Lorem' });

		const checkbox = within(option).getByRole('checkbox', { hidden: true });

		expect(option).toHaveAttribute('aria-selected', 'true');
		expect(checkbox).toHaveAttribute('aria-hidden', 'true');
		expect(checkbox).toHaveAttribute('tabindex', '-1');
		expect(checkbox).toBeChecked();
	});
});
