import { render } from '@testing-library/react';
import { createRef } from 'react';

import PaginatedMultiSelect from './PaginatedMultiSelect.js';
import { withResizeObserverMock } from '../../../mocks/withResizeObserverMock.js';

withResizeObserverMock();

describe('[PaginatedMultiSelect Component]', () => {
	it('should attach the consumer ref to its root', () => {
		const ref = createRef<HTMLDivElement>();

		const { container } = render(<PaginatedMultiSelect ref={ref} options={[]} onChange={jest.fn()} />);

		expect(ref.current).toBe(container.firstElementChild);
	});
});
