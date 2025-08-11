import { render, screen, waitFor } from '@testing-library/react';

import { useRestoreScrollPosition } from './useRestoreScrollPosition';
import { RoomManager } from '../../../../lib/RoomManager';

jest.mock('../../../../lib/RoomManager', () => ({
	RoomManager: {
		getStore: jest.fn(),
	},
	useOpenedRoom: jest.fn(() => 'room-id'),
	useSecondLevelOpenedRoom: jest.fn(() => 'room-id'),
}));

describe('useRestoreScrollPosition', () => {
	it('should restore room scroll position based on store', () => {
		const store = {
			scroll: 123,
			atBottom: false,
			update: jest.fn(),
		};
		(RoomManager.getStore as jest.Mock).mockReturnValue(store);

		const Test = () => {
			const { innerRef } = useRestoreScrollPosition('GENERAL');
			return (
				<div ref={innerRef} style={{ height: '100px', overflowY: 'scroll' }} data-testid='scrollable-element'>
					<div style={{ height: '800px' }}></div>
				</div>
			);
		};

		render(<Test />);

		expect(screen.getByTestId('scrollable-element')).toBeInTheDocument();
		expect(screen.getByTestId('scrollable-element')).toHaveStyle({ height: '100px', overflowY: 'scroll' });
		expect(screen.getByTestId('scrollable-element')).toHaveProperty('scrollTop', 123);
	});

	it('should jump to bottom if atBottom is true', () => {
		const store = {
			scroll: 123,
			atBottom: true,
			update: jest.fn(),
		};
		(RoomManager.getStore as jest.Mock).mockReturnValue(store);

		const Test = () => {
			const { innerRef } = useRestoreScrollPosition('GENERAL');
			return (
				<div ref={innerRef} style={{ height: '100px', overflowY: 'scroll' }} data-testid='scrollable-element'>
					<div style={{ height: '800px' }}></div>
				</div>
			);
		};

		render(<Test />);

		expect(screen.getByTestId('scrollable-element')).toBeInTheDocument();
		expect(screen.getByTestId('scrollable-element')).toHaveStyle({ height: '100px', overflowY: 'scroll' });
		expect(screen.getByTestId('scrollable-element')).toHaveProperty('scrollTop', 0);
	});

	it('should do nothing if no previous scroll position is stored', () => {
		const store = {
			scroll: undefined,
			atBottom: false,
			update: jest.fn(),
		};

		(RoomManager.getStore as jest.Mock).mockReturnValue(store);
		const Test = () => {
			const { innerRef } = useRestoreScrollPosition('GENERAL');
			return (
				<div ref={innerRef} style={{ height: '100px', overflowY: 'scroll' }} data-testid='scrollable-element'>
					<div style={{ height: '800px' }}></div>
				</div>
			);
		};

		(RoomManager.getStore as jest.Mock).mockReturnValue({ scroll: undefined });
		render(<Test />);
		expect(screen.getByTestId('scrollable-element')).toBeInTheDocument();
		expect(screen.getByTestId('scrollable-element')).toHaveStyle({ height: '100px', overflowY: 'scroll' });
		expect(screen.getByTestId('scrollable-element')).toHaveProperty('scrollTop', 0);
	});

	it('should update store based on scroll position', async () => {
		const store = {
			scroll: 1,
			atBottom: false,
			update: jest.fn(),
		};
		(RoomManager.getStore as jest.Mock).mockReturnValue(store);
		const Test = () => {
			const { innerRef } = useRestoreScrollPosition('GENERAL', 0);
			return (
				<div ref={innerRef} style={{ height: '100px', overflowY: 'scroll', display: 'block' }} data-testid='scrollable-element'>
					<div style={{ height: '800px' }}></div>
				</div>
			);
		};
		render(<Test />);
		const scrollableElement = screen.getByTestId('scrollable-element');
		scrollableElement.scrollTop = 50;
		scrollableElement.dispatchEvent(new Event('scroll'));

		await waitFor(() => {
			expect(store.update).toHaveBeenCalled();
		});
	});
});
