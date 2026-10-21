import { composeStories } from '@storybook/react-webpack5';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import AutoComplete from './AutoComplete';
import * as stories from './AutoComplete.stories';
import { withResizeObserverMock } from '../../../mocks/withResizeObserverMock';
import { render } from '../../testing';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

withResizeObserverMock();

describe('[AutoComplete Rendering]', () => {
	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { container } = render(<Story />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});

describe('[Autocomplete functionality]', () => {
	it('should disabled the input when disabled prop is true', () => {
		render(
			<AutoComplete value='1' filter='test' setFilter={() => {}} options={[{ value: '1', label: 'test1' }]} onChange={() => {}} disabled />,
		);

		const input = screen.getByRole('textbox');
		expect(input).toBeDisabled();
	});

	it('should remove selected item when clicking on the remove button (multiple)', async () => {
		const onChange = jest.fn();
		render(
			<AutoComplete
				value={['1', '2']}
				filter='test'
				setFilter={() => {}}
				options={[
					{ value: '1', label: 'test1' },
					{ value: '2', label: 'test2' },
				]}
				onChange={onChange}
				multiple
			/>,
		);

		const removeButton = screen.getByRole('button', { name: 'test1' });

		await userEvent.click(removeButton);

		expect(onChange).toHaveBeenCalledWith(['2']);
	});

	it('should remove selected item when clicking on the remove button (single)', async () => {
		const onChange = jest.fn();
		render(<AutoComplete value='1' filter='test' setFilter={() => {}} options={[{ value: '1', label: 'test1' }]} onChange={onChange} />);

		const removeButton = screen.getByRole('button', { name: 'test1' });
		await userEvent.click(removeButton);

		expect(onChange).toHaveBeenCalledWith('');
	});

	it('should update selected items based on the value prop', () => {
		const { rerender } = render(
			<AutoComplete
				value={['1']}
				filter='test'
				setFilter={() => {}}
				options={[{ value: '1', label: 'test1' }]}
				onChange={() => {}}
				multiple
			/>,
		);

		expect(screen.getByRole('button', { name: 'test1' })).toBeInTheDocument();

		rerender(
			<AutoComplete
				value={[]}
				filter='test'
				setFilter={() => {}}
				options={[
					{ value: '1', label: 'test1' },
					{ value: '2', label: 'test2' },
				]}
				onChange={() => {}}
			/>,
		);
		expect(screen.queryByRole('button', { name: 'test1' })).not.toBeInTheDocument();
	});
});
