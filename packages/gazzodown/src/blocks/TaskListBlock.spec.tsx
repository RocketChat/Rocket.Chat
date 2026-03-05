import { render, screen } from '@testing-library/react';

import { MarkupInteractionContext } from '..';
import TaskListBlock from './TaskListBlock';

describe('TaskListBlock', () => {
	it('renders tasks with checkboxes', () => {
		render(
			<TaskListBlock
				tasks={[
					{ type: 'TASK', status: true, value: [{ type: 'PLAIN_TEXT', value: 'Done' }] },
					{ type: 'TASK', status: false, value: [{ type: 'PLAIN_TEXT', value: 'Pending' }] },
				]}
			/>,
		);

		const checkboxes = screen.getAllByRole('checkbox');
		expect(checkboxes).toHaveLength(2);
		expect(checkboxes[0]).toBeChecked();
		expect(checkboxes[1]).not.toBeChecked();
	});

	it('calls onTaskChecked from context when provided', () => {
		const onTaskChecked = jest.fn(() => () => undefined);
		render(
			<MarkupInteractionContext.Provider value={{ onTaskChecked }}>
				<TaskListBlock tasks={[{ type: 'TASK', status: false, value: [{ type: 'PLAIN_TEXT', value: 'Task' }] }]} />
			</MarkupInteractionContext.Provider>,
		);

		expect(onTaskChecked).toHaveBeenCalled();
	});

	it('matches snapshot', () => {
		const { container } = render(
			<TaskListBlock
				tasks={[
					{ type: 'TASK', status: true, value: [{ type: 'PLAIN_TEXT', value: 'Complete' }] },
					{ type: 'TASK', status: false, value: [{ type: 'PLAIN_TEXT', value: 'Incomplete' }] },
				]}
			/>,
		);
		expect(container).toMatchSnapshot();
	});
});
