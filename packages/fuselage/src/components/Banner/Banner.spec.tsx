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

	it('calls onAction when pressed by click or Enter', () => {
		const onAction = jest.fn();
		render(<Banner onAction={onAction}>content</Banner>);

		fireEvent.click(screen.getByRole('button'));
		fireEvent.keyDown(screen.getByRole('button'), { code: 'Enter' });
		expect(onAction).toHaveBeenCalledTimes(2);
	});

	it('calls onClose without calling onAction', () => {
		const onAction = jest.fn();
		const onClose = jest.fn();
		render(
			<Banner closeable onAction={onAction} onClose={onClose}>
				content
			</Banner>,
		);

		fireEvent.click(screen.getAllByRole('button')[1]);
		expect(onClose).toHaveBeenCalledTimes(1);
		expect(onAction).not.toHaveBeenCalled();
	});
});
