import { render, screen } from '@testing-library/react';
import { createRef } from 'react';

import PaginatedMultiSelect from './PaginatedMultiSelect';
import { withResizeObserverMock } from '../../../mocks/withResizeObserverMock';

withResizeObserverMock();

describe('[PaginatedMultiSelect Component]', () => {
	it('should attach the consumer ref to its root', () => {
		const ref = createRef<HTMLDivElement>();

		render(<PaginatedMultiSelect ref={ref} data-testid='root' options={[]} onChange={jest.fn()} />);

		expect(ref.current).toBe(screen.getByTestId('root'));
	});
});
