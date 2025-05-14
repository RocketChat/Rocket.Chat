import { Box, Button } from '@rocket.chat/fuselage';
import type { Meta, StoryObj } from '@storybook/react';
import { within, fireEvent, waitFor, expect } from '@storybook/test';
import { useEffect, useState, type Ref } from 'react';

import { useDraggable, DEFAULT_BOUNDING_ELEMENT_OPTIONS } from './DraggableCore';

class BoundingBoxResizeEvent extends Event {
	constructor(
		public width: number,
		public height: number,
	) {
		super('BoundingBoxResize');
	}

	get size() {
		return {
			width: this.width,
			height: this.height,
		};
	}
}

const isBoundingBoxResizeEvent = (event: unknown): event is BoundingBoxResizeEvent => {
	return event instanceof BoundingBoxResizeEvent;
};

const BOUNDING_SIZE = 1000;

const DraggableBase = ({
	boundingRef,
	draggableRef,
	handleRef,
	onClick,
	onClickResize,
	backgroundColor,
	height,
	width,
}: {
	boundingRef: Ref<HTMLElement>;
	draggableRef: Ref<HTMLElement>;
	handleRef: Ref<HTMLElement>;
	onClick?: () => void;
	onClickResize?: () => void;
	backgroundColor?: string;
	height?: number;
	width?: number;
}) => {
	const [boundingSize, setBoundingSize] = useState<{ width: number; height: number }>({
		width: BOUNDING_SIZE,
		height: BOUNDING_SIZE,
	});

	useEffect(() => {
		const handleBoundingBoxResize = (event: unknown) => {
			if (isBoundingBoxResizeEvent(event)) {
				setBoundingSize(event.size);
			}
		};
		window.addEventListener('BoundingBoxResize', handleBoundingBoxResize);
		return () => {
			window.removeEventListener('BoundingBoxResize', handleBoundingBoxResize);
		};
	}, []);

	return (
		<Box
			display='block'
			ref={boundingRef}
			id='bounding-box'
			position='fixed'
			width={boundingSize?.width ?? 'full'}
			height={boundingSize?.height ?? 'full'}
			style={{ overflow: 'hidden' }}
			data-testid='bounding-box'
		>
			<Box
				display='block'
				ref={draggableRef}
				id='draggable-box'
				width={width ?? 300}
				height={height ?? 250}
				backgroundColor={backgroundColor ?? 'blue'}
				data-testid='draggable-box'
			>
				<Box ref={handleRef} id='drag-handle' width='100%' height={40} backgroundColor='red' data-testid='drag-handle' />
				{!!onClick && (
					<Button data-testid='change-view' onClick={onClick}>
						Change view
					</Button>
				)}
				{!!onClickResize && (
					<Button data-testid='resize-box' onClick={onClickResize}>
						Resize box
					</Button>
				)}
			</Box>
		</Box>
	);
};

const DraggableBox = () => {
	const [draggableRef, boundingRef, handleRef] = useDraggable();

	return <DraggableBase boundingRef={boundingRef} draggableRef={draggableRef} handleRef={handleRef} />;
};

const SECONDARY_DRAGGABLE_BOX_SIZE = 600;

// Component for testing position restore when element is replaced
// E.g. When a state changes the rendered component, the new component should have the same positioning
const DraggableBoxWrapper = () => {
	const [draggableRef, boundingRef, handleRef] = useDraggable();
	const [view, setView] = useState<'initial' | 'updated' | 'resized'>('initial');
	const [height, setHeight] = useState<number | undefined>(undefined);
	const [width, setWidth] = useState<number | undefined>(undefined);

	const onClick = () => {
		setView(view === 'initial' ? 'updated' : 'initial');
	};

	const onClickResize = () => {
		const getSize = (previous: number | undefined) => {
			if (typeof previous === 'undefined') {
				return SECONDARY_DRAGGABLE_BOX_SIZE;
			}
			return undefined;
		};
		setHeight((prevHeight) => getSize(prevHeight));
		setWidth((prevWidth) => getSize(prevWidth));
	};

	if (view === 'initial') {
		return (
			<DraggableBase
				key={view}
				boundingRef={boundingRef}
				draggableRef={draggableRef}
				handleRef={handleRef}
				onClick={onClick}
				onClickResize={onClickResize}
				height={height}
				width={width}
			/>
		);
	}

	return (
		<DraggableBase
			backgroundColor='green'
			key={view}
			boundingRef={boundingRef}
			draggableRef={draggableRef}
			handleRef={handleRef}
			onClick={onClick}
			onClickResize={onClickResize}
			height={height}
			width={width}
		/>
	);
};

const meta = {
	title: 'hooks/useDraggable',
	component: DraggableBox,
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<typeof DraggableBox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DraggingBehavior: Story = {
	...Default,
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement.parentElement || canvasElement);

		await step('should allow dragging an element', async () => {
			const handle = await canvas.findByTestId('drag-handle');
			const draggable = await canvas.findByTestId('draggable-box');

			await expect(handle).toBeInTheDocument();
			await expect(draggable).toBeInTheDocument();

			const initialRect = draggable.getBoundingClientRect();
			const handleRect = handle.getBoundingClientRect();
			const startX = handleRect.left + handleRect.width / 2;
			const startY = handleRect.top + handleRect.height / 2;

			await fireEvent.pointerDown(handle, {
				clientX: startX,
				clientY: startY,
			});

			await fireEvent.pointerMove(document.documentElement, {
				clientX: startX + 100,
				clientY: startY + 100,
			});

			await fireEvent.pointerUp(document.documentElement);

			await waitFor(() => {
				const finalRect = draggable.getBoundingClientRect();
				expect(finalRect.x).toBeCloseTo(initialRect.x + 100, 0);
				expect(finalRect.y).toBeCloseTo(initialRect.y + 100, 0);
			});
		});

		await step('should only allow dragging when using the handle element', async () => {
			const draggable = await canvas.findByTestId('draggable-box');
			const initialRect = draggable.getBoundingClientRect();

			const draggableRect = draggable.getBoundingClientRect();
			const startX = draggableRect.left + draggableRect.width / 2;
			const startY = draggableRect.top + draggableRect.height / 2;

			await fireEvent.pointerDown(draggable, {
				clientX: startX,
				clientY: startY,
			});
			await fireEvent.pointerMove(document.documentElement, {
				clientX: startX + 100,
				clientY: startY + 100,
			});
			await fireEvent.pointerUp(document.documentElement);

			await waitFor(() => {
				const finalRect = draggable.getBoundingClientRect();
				expect(finalRect.x).toBeCloseTo(initialRect.x, 0);
				expect(finalRect.y).toBeCloseTo(initialRect.y, 0);
			});
		});
	},
};

export const BoundingBehavior: Story = {
	...Default,
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement.parentElement || canvasElement);

		await step('should keep element within screen bounds when dragged outside (top-left)', async () => {
			const handle = await canvas.findByTestId('drag-handle');
			const draggable = await canvas.findByTestId('draggable-box');
			const boundingBox = await canvas.findByTestId('bounding-box');

			const handleRect = handle.getBoundingClientRect();
			await fireEvent.pointerDown(handle, {
				clientX: handleRect.left + handleRect.width / 2,
				clientY: handleRect.top + handleRect.height / 2,
			});

			await fireEvent.pointerMove(document.documentElement, {
				clientX: 0,
				clientY: 0,
			});
			await fireEvent.pointerUp(document.documentElement);

			await waitFor(() => {
				const finalRect = draggable.getBoundingClientRect();
				const boundingBoxRect = boundingBox.getBoundingClientRect();
				expect(finalRect.left).toBeGreaterThanOrEqual(boundingBoxRect.left);
				expect(finalRect.top).toBeGreaterThanOrEqual(boundingBoxRect.top);
			});
		});

		await step('should keep element within screen bounds when dragged outside (bottom-right)', async () => {
			const handle = await canvas.findByTestId('drag-handle');
			const draggable = await canvas.findByTestId('draggable-box');
			const boundingBox = await canvas.findByTestId('bounding-box');

			const handleRect = handle.getBoundingClientRect();
			await fireEvent.pointerDown(handle, {
				clientX: handleRect.left + handleRect.width / 2,
				clientY: handleRect.top + handleRect.height / 2,
			});

			const boundingBoxRect = boundingBox.getBoundingClientRect();
			await fireEvent.pointerMove(document.documentElement, {
				clientX: boundingBoxRect.right + 200,
				clientY: boundingBoxRect.bottom + 200,
			});
			await fireEvent.pointerUp(document.documentElement);

			await waitFor(() => {
				const finalRect = draggable.getBoundingClientRect();
				const currentBoundingBoxRect = boundingBox.getBoundingClientRect();
				expect(finalRect.right).toBeLessThanOrEqual(currentBoundingBoxRect.right + 1);
				expect(finalRect.bottom).toBeLessThanOrEqual(currentBoundingBoxRect.bottom + 1);
			});
		});

		await step('should adjust element position when screen is resized and element is cut off', async () => {
			const handle = await canvas.findByTestId('drag-handle');
			const draggable = await canvas.findByTestId('draggable-box');
			const boundingBox = (await canvas.findByTestId('bounding-box')) as HTMLElement;

			const initialBoundingBoxRect = boundingBox.getBoundingClientRect();
			const draggableInitialRect = draggable.getBoundingClientRect();

			const targetX = initialBoundingBoxRect.right - draggableInitialRect.width / 2;
			const targetY = initialBoundingBoxRect.bottom - draggableInitialRect.height / 2;

			const handleRect = handle.getBoundingClientRect();
			await fireEvent.pointerDown(handle, {
				clientX: handleRect.left + handleRect.width / 2,
				clientY: handleRect.top + handleRect.height / 2,
			});
			await fireEvent.pointerMove(document.documentElement, { clientX: targetX, clientY: targetY });
			await fireEvent.pointerUp(document.documentElement);

			await waitFor(() => {
				const rect = draggable.getBoundingClientRect();
				expect(rect.right).toBeCloseTo(initialBoundingBoxRect.right, 0);
				expect(rect.bottom).toBeCloseTo(initialBoundingBoxRect.bottom, 0);
			});

			window.dispatchEvent(new BoundingBoxResizeEvent(500, 500));

			await waitFor(() => {
				const finalRect = draggable.getBoundingClientRect();
				const newBoundingBoxRect = boundingBox.getBoundingClientRect();

				expect(newBoundingBoxRect.width).toBeCloseTo(500, 0);
				expect(newBoundingBoxRect.height).toBeCloseTo(500, 0);

				expect(finalRect.right).toBeLessThanOrEqual(newBoundingBoxRect.right + 1);
				expect(finalRect.bottom).toBeLessThanOrEqual(newBoundingBoxRect.bottom + 1);
				expect(finalRect.left).toBeGreaterThanOrEqual(newBoundingBoxRect.left - 1);
				expect(finalRect.top).toBeGreaterThanOrEqual(newBoundingBoxRect.top - 1);
			});
		});
	},
};

export const ElementUpdates: Story = {
	render: () => <DraggableBoxWrapper />,
	play: async ({ canvasElement, step }) => {
		const canvas = within(canvasElement.parentElement || canvasElement);

		await step('should maintain position when element is replaced', async () => {
			const handle = await canvas.findByTestId('drag-handle');
			const draggable = await canvas.findByTestId('draggable-box');

			const initialRect = draggable.getBoundingClientRect();
			const handleRect = handle.getBoundingClientRect();

			const startX = handleRect.left + handleRect.width / 2;
			const startY = handleRect.top + handleRect.height / 2;

			await fireEvent.pointerDown(handle, {
				clientX: startX,
				clientY: startY,
			});
			await fireEvent.pointerMove(document.documentElement, {
				clientX: startX + 50,
				clientY: startY + 50,
			});
			await fireEvent.pointerUp(document.documentElement);

			let positionBeforeRerender: DOMRect = new DOMRect(0, 0, 0, 0);
			await waitFor(() => {
				positionBeforeRerender = draggable.getBoundingClientRect();
				expect(positionBeforeRerender.x).toBeCloseTo(initialRect.x + 50, 0);
				expect(positionBeforeRerender.y).toBeCloseTo(initialRect.y + 50, 0);
			});

			await fireEvent.click(await canvas.findByTestId('change-view'));

			const currentDraggable = await canvas.findByTestId('draggable-box');
			const positionAfterDrag = currentDraggable.getBoundingClientRect();

			expect(positionAfterDrag.x).toBeCloseTo(positionBeforeRerender.x, 0);
			expect(positionAfterDrag.y).toBeCloseTo(positionBeforeRerender.y, 0);
		});

		// TODO: Fix positioning when draggable element resizes
		await step("should maintain position but keep element within bounds if it's size changes", async () => {
			const handle = await canvas.findByTestId('drag-handle');
			const draggable = await canvas.findByTestId('draggable-box');

			// wait for bounding box to emit the initial resize event
			await waitFor(() => new Promise((resolve) => setTimeout(resolve, DEFAULT_BOUNDING_ELEMENT_OPTIONS.resizeDebounce)));

			const initialRect = draggable.getBoundingClientRect();
			const handleRect = handle.getBoundingClientRect();
			const startX = handleRect.left + handleRect.width / 2;
			const startY = handleRect.top + handleRect.height / 2;

			await fireEvent.pointerDown(handle, {
				clientX: startX,
				clientY: startY,
			});

			// move the elemnt to the edge of the bounding box
			await fireEvent.pointerMove(document.documentElement, {
				clientX: startX + (BOUNDING_SIZE - initialRect.width),
				clientY: startY + (BOUNDING_SIZE - initialRect.height),
			});
			await fireEvent.pointerUp(document.documentElement);

			let positionBeforeRerender: DOMRect = new DOMRect(0, 0, 0, 0);
			await waitFor(() => {
				positionBeforeRerender = draggable.getBoundingClientRect();
				expect(positionBeforeRerender.x).toBeCloseTo(BOUNDING_SIZE - initialRect.width, 0);
				expect(positionBeforeRerender.y).toBeCloseTo(BOUNDING_SIZE - initialRect.height, 0);
			});

			await fireEvent.click(await canvas.findByTestId('resize-box'));

			const currentDraggable = await canvas.findByTestId('draggable-box');
			await waitFor(() => {
				const positionAfterDrag = currentDraggable.getBoundingClientRect();
				expect(positionAfterDrag.x).toBeCloseTo(BOUNDING_SIZE - SECONDARY_DRAGGABLE_BOX_SIZE, 0);
				expect(positionAfterDrag.y).toBeCloseTo(BOUNDING_SIZE - SECONDARY_DRAGGABLE_BOX_SIZE, 0);
			});
		});
	},
};
