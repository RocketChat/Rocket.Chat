import { fireEvent, screen } from '@testing-library/react';

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

	it('does not trigger onAction when Enter is pressed on nested link', () => {
		const handleAction = jest.fn();
		render(<Banner onAction={handleAction} link='https://rocket.chat' linkText='More info' />);
		const link = screen.getByRole('link', {
			name: /more info/i,
		});

		fireEvent.keyDown(link, { code: 'Enter' });
		expect(handleAction).not.toHaveBeenCalled();
	});

	it('does not trigger onAction when Enter is pressed on close button', () => {
		const handleAction = jest.fn();
		const handleClose = jest.fn();
		const { container } = render(<Banner onAction={handleAction} closeable onClose={handleClose} />);
		const closeButton = container.querySelector('.rcx-banner__close-button button');

		expect(closeButton).not.toBeNull();
		if (closeButton) {
			fireEvent.keyDown(closeButton, { code: 'Enter' });
			expect(handleAction).not.toHaveBeenCalled();
		}
	});

	it('triggers onAction when Enter is pressed on banner itself', () => {
		const handleAction = jest.fn();
		const { container } = render(<Banner onAction={handleAction} />);
		const banner = container.querySelector('.rcx-banner');

		expect(banner).not.toBeNull();
		if (banner) {
			fireEvent.keyDown(banner, { code: 'Enter' });
			expect(handleAction).toHaveBeenCalledTimes(1);
		}
	});
});

