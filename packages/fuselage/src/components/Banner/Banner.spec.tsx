import { screen } from '@testing-library/react';

import Banner from './Banner';
import { withResizeObserverMock } from '../../../mocks/withResizeObserverMock';
import { render } from '../../testing';

withResizeObserverMock();

describe('[Banner Component]', () => {
	it('renders without crashing', () => {
		render(<Banner />);
		expect(screen.getByRole('banner')).toHaveClass('rcx-banner');
	});

	it('renders with link', () => {
		render(<Banner link='https://rocket.chat' linkText='More info' />);
		expect(
			screen.getByRole('link', {
				name: /more info/i,
			}),
		).toBeInTheDocument();
	});

	it('renders close button with default accessible name', () => {
		render(<Banner closeable onClose={jest.fn()} />);

		expect(
			screen.getByRole('button', {
				name: 'Close',
			}),
		).toBeInTheDocument();
	});

	it('renders close button with custom accessible name', () => {
		render(<Banner closeable onClose={jest.fn()} closeButtonLabel='Dismiss notification' />);

		expect(
			screen.getByRole('button', {
				name: 'Dismiss notification',
			}),
		).toBeInTheDocument();
	});
});
