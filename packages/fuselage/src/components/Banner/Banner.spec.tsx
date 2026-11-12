import { screen } from '@testing-library/react';

import Banner from './Banner.js';
import { withResizeObserverMock } from '../../../mocks/withResizeObserverMock.js';
import { render } from '../../testing.js';

withResizeObserverMock();

describe('[Banner Component]', () => {
	it('renders without crashing', () => {
		render(<Banner />);
	});

	it('renders with link', () => {
		render(<Banner link='https://rocket.chat' linkText='More info' />);
		expect(
			screen.getByRole('link', {
				name: /more info/i,
			}),
		).toBeInTheDocument();
	});
});
