import { render, screen } from '@testing-library/react';

import AutoCompleteDepartmentAgent from './AutoCompleteDepartmentAgent';

it('should not display the placeholder when there is a value', () => {
	const { rerender } = render(<AutoCompleteDepartmentAgent value='' onChange={jest.fn()} placeholder='Select an agent' agents={[]} />);

	expect(screen.getByPlaceholderText('Select an agent')).toBeInTheDocument();

	rerender(<AutoCompleteDepartmentAgent value='agent1' onChange={jest.fn()} placeholder='Select an agent' agents={[]} />);

	expect(screen.queryByPlaceholderText('Select an agent')).not.toBeInTheDocument();
});
