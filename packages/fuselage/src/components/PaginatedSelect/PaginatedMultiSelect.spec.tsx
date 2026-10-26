import { render } from '@testing-library/react';
import { createRef } from 'react';

import { withResizeObserverMock } from '../../../mocks/withResizeObserverMock';
import PaginatedMultiSelect from './PaginatedMultiSelect';

withResizeObserverMock();

describe('[PaginatedMultiSelect Component]', () => {
	it('should attach the consumer ref to its root', () => {
		const ref = createRef<HTMLDivElement>();

		const { container } = render(<PaginatedMultiSelect ref={ref} options={[]} onChange={jest.fn()} />);

		expect(ref.current).toBe(container.firstElementChild);
	});
});
