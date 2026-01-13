import { render } from '@testing-library/react';

import HeaderTag from './HeaderTag';

it('should match snapshot', () => {
	const { baseElement } = render(<HeaderTag>Test Tag</HeaderTag>);
	expect(baseElement).toMatchSnapshot();
});
