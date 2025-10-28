import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import MultiSelectCustomList from './MultiSelectCustomList';

it('should render options with correct checked state', () => {
	render(
		<MultiSelectCustomList
			options={[
				{ id: '1', text: 'Option 1', checked: true },
				{ id: '2', text: 'Option 2', checked: false },
			]}
			onSelected={jest.fn()}
		/>,
		{ wrapper: mockAppRoot().build() },
	);

	const option1 = screen.getByLabelText('Option 1');
	expect(option1).toBeInTheDocument();
	expect(option1).toBeChecked();

	const option2 = screen.getByLabelText('Option 2');
	expect(option2).toBeInTheDocument();
	expect(option2).not.toBeChecked();
});

it('should not render group title as selectable option', () => {
	render(
		<MultiSelectCustomList
			options={[
				{ id: '1', text: 'Group title', isGroupTitle: true },
				{ id: '2', text: 'Option 1', checked: false },
			]}
			onSelected={jest.fn()}
		/>,
		{ wrapper: mockAppRoot().build() },
	);

	expect(screen.getByText('Group title')).toBeInTheDocument();
	expect(screen.queryByRole('checkbox', { name: /Group title/i })).not.toBeInTheDocument();

	const option1 = screen.getByLabelText('Option 1');
	expect(option1).toBeInTheDocument();
	expect(option1).not.toBeChecked();
});
