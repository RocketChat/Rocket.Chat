import { Box } from '@rocket.chat/fuselage';
import { act, render, fireEvent } from '@testing-library/react';

import { useDraggable } from './DraggableCore';

const DraggableBox = () => {
	const [draggableRef, boundingRef, handleRef] = useDraggable();

	return (
		<Box
			display='block'
			ref={boundingRef}
			id='bounding-box'
			position='fixed'
			width={1000}
			height={1000}
			inset={0}
			style={{ overflow: 'hidden' }}
		>
			<Box display='block' ref={draggableRef} id='draggable-box' width={300} height={250} backgroundColor='primary-500'>
				<Box ref={handleRef} id='drag-handle' width='100%' height={40} backgroundColor='primary-600' />
			</Box>
		</Box>
	);
};

// TODO: These tests do not work because `getBoundingClientRect` does not return valid values in JSDOM
describe.skip('useDraggable', () => {
	describe('dragging behavior', () => {
		it('should allow dragging an element', () => {
			const { container } = render(<DraggableBox />);
			const handle = container.querySelector('#drag-handle');
			const draggable = container.querySelector('#draggable-box');
			const bounding = container.querySelector('#bounding-box');

			if (!handle || !draggable) {
				throw new Error('Required elements not found');
			}

			const boundingRect = bounding?.getBoundingClientRect();
			const initialRect = draggable.getBoundingClientRect();
			console.log({ initialRect, draggable, boundingRect });

			act(() => {
				// Start dragging
				fireEvent.pointerDown(handle, {
					clientX: 0,
					clientY: 0,
				});

				// Move pointer
				fireEvent.pointerMove(window, {
					clientX: 100,
					clientY: 100,
				});

				// End dragging
				fireEvent.pointerUp(window);
			});

			const finalRect = draggable.getBoundingClientRect();

			expect(finalRect.x).toBe(initialRect.x + 100);
			expect(finalRect.y).toBe(initialRect.y + 100);
		});

		it('should only allow dragging when using the handle element', () => {
			const { container } = render(<DraggableBox />);
			const draggable = container.querySelector('#draggable-box');

			if (!draggable) {
				throw new Error('Required element not found');
			}

			const initialRect = draggable.getBoundingClientRect();

			// Try to drag the main element directly
			fireEvent.pointerDown(draggable, {
				clientX: 0,
				clientY: 0,
			});

			fireEvent.pointerMove(window, {
				clientX: 100,
				clientY: 100,
			});

			fireEvent.pointerUp(window);

			const finalRect = draggable.getBoundingClientRect();

			// Position should not change when dragging the main element
			expect(finalRect.x).toBe(initialRect.x);
			expect(finalRect.y).toBe(initialRect.y);
		});
	});

	describe('bounding behavior', () => {
		it('should keep element within screen bounds when dragged outside', () => {
			const { container } = render(<DraggableBox />);
			const handle = container.querySelector('#drag-handle');
			const draggable = container.querySelector('#draggable-box');

			if (!handle || !draggable) {
				throw new Error('Required elements not found');
			}

			// Start dragging
			fireEvent.pointerDown(handle, {
				clientX: 0,
				clientY: 0,
			});

			// Try to drag way outside bounds
			fireEvent.pointerMove(window, {
				clientX: -1,
				clientY: -1,
			});

			fireEvent.pointerUp(window);

			const finalRect = draggable.getBoundingClientRect();

			// Element should stay within bounds
			expect(finalRect.right).toBeGreaterThanOrEqual(0);
			expect(finalRect.bottom).toBeGreaterThanOrEqual(0);
		});

		it('should adjust element position when screen is resized and element is cut off', () => {
			const { container } = render(<DraggableBox />);
			const draggable = container.querySelector('#draggable-box');

			if (!draggable) {
				throw new Error('Required element not found');
			}

			// Position element near the edge
			act(() => {
				fireEvent.pointerDown(draggable, {
					clientX: 0,
					clientY: 0,
				});

				fireEvent.pointerMove(window, {
					clientX: 900,
					clientY: 900,
				});

				fireEvent.pointerUp(window);
			});

			// Simulate window resize
			act(() => {
				Object.defineProperty(window, 'innerWidth', { value: 500 });
				Object.defineProperty(window, 'innerHeight', { value: 500 });
				window.dispatchEvent(new Event('resize'));
			});

			const finalRect = draggable.getBoundingClientRect();
			console.log({ finalRect });

			// Element should be adjusted to stay within new bounds
			expect(finalRect.right).toBeLessThanOrEqual(500);
			expect(finalRect.bottom).toBeLessThanOrEqual(500);
		});
	});

	describe('element updates', () => {
		it('should maintain position when element is replaced', () => {
			const { container, rerender } = render(<DraggableBox />);
			const handle = container.querySelector('#drag-handle');
			const draggable = container.querySelector('#draggable-box');

			if (!handle || !draggable) {
				throw new Error('Required elements not found');
			}

			// Move element to a specific position
			act(() => {
				fireEvent.pointerDown(handle, {
					clientX: 0,
					clientY: 0,
				});

				fireEvent.pointerMove(window, {
					clientX: 100,
					clientY: 100,
				});

				fireEvent.pointerUp(window);
			});

			const positionBeforeRerender = draggable.getBoundingClientRect();

			// Rerender the component
			rerender(<DraggableBox />);

			const newDraggable = container.querySelector('#draggable-box');
			if (!newDraggable) {
				throw new Error('Required element not found after rerender');
			}

			const positionAfterRerender = newDraggable.getBoundingClientRect();

			// Position should be maintained after rerender
			expect(positionAfterRerender.x).toBe(positionBeforeRerender.x);
			expect(positionAfterRerender.y).toBe(positionBeforeRerender.y);
		});
	});
});
