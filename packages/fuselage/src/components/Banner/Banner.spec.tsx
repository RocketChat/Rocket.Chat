import { screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import Banner from './Banner';
import { withResizeObserverMock } from '../../../mocks/withResizeObserverMock';
import { render } from '../../testing';

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

	it('renders close button with default aria-label "Close"', () => {
		render(<Banner closeable onClose={() => {}} />);
		expect(
			screen.getByRole('button', {
				name: 'Close',
			}),
		).toBeInTheDocument();
	});

	it('renders close button with custom closeButtonLabel', () => {
		render(<Banner closeable onClose={() => {}} closeButtonLabel='Dismiss notification' />);
		expect(
			screen.getByRole('button', {
				name: 'Dismiss notification',
			}),
		).toBeInTheDocument();
	});

	it('should have no a11y violations when closeable', async () => {
		const { container } = render(<Banner closeable onClose={() => {}} />);
		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});
