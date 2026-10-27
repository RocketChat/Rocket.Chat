import { composeStories } from '@storybook/react-webpack5';
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
		const { getByRole } = render(<Option role='option' value='1' label='Lorem' focus selected />);

		const option = getByRole('option', { name: 'Lorem' });

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
		const { getByText } = render(<Option label='Empty' />);

		expect(getByText('Empty').closest('div.rcx-option__content')).not.toBe(null);
	});

	it('should name the icon with `iconLabel` and hide it otherwise', () => {
		const { getByRole, rerender, container } = render(<Option label='rocket.cat' icon='globe' iconLabel='Federated' />);

		expect(getByRole('img', { name: 'Federated' })).toBeInTheDocument();

		rerender(<Option label='rocket.cat' icon='globe' />);

		expect(container.querySelector('.rcx-option__column')).toHaveAttribute('aria-hidden', 'true');
	});

	it('should call onClick when click', () => {
		const click = jest.fn();

		const { getByText } = render(
			<Option onClick={click}>
				<OptionContent>Option</OptionContent>
			</Option>,
		);

		getByText('Option').click();

		expect(click).toHaveBeenCalledTimes(1);
	});

	it('should call prevent when click on disabled', () => {
		const click = jest.fn();

		const { getByText } = render(
			<Option disabled onClick={click}>
				<OptionContent>Option</OptionContent>
			</Option>,
		);

		getByText('Option').click();

		expect(click).toHaveBeenCalledTimes(0);
		expect(prevent).toHaveBeenCalledTimes(1);
	});
});

describe('CheckOption', () => {
	it('should announce selection through `aria-selected` and hide the checkbox', () => {
		const { getByRole } = render(
			<CheckOption role='option' selected>
				Lorem
			</CheckOption>,
		);

		const option = getByRole('option', { name: 'Lorem' });

		expect(option).toHaveAttribute('aria-selected', 'true');
		expect(option.querySelector('input[type="checkbox"]')).toHaveAttribute('aria-hidden', 'true');
		expect(option.querySelector('input[type="checkbox"]')).toHaveAttribute('tabindex', '-1');
		expect(option.querySelector('input[type="checkbox"]')).toBeChecked();
	});
});
