import { render } from '@testing-library/react';

import FilterBarFilters from './FilterBarFilters';

it('should not reserve a slot for an omitted filter', () => {
	const showStatus = false;
	const { container } = render(
		<FilterBarFilters>
			<input aria-label='first' />
			{showStatus && <input aria-label='status' />}
			{null}
			<input aria-label='last' />
		</FilterBarFilters>,
	);

	// Slots are plain layout boxes with no role to query by
	// oxlint-disable-next-line testing-library/no-node-access
	expect(container.firstElementChild?.children).toHaveLength(2);
});
