import { Emitter, OffCallbackHandler } from '@rocket.chat/emitter';
import { useSafeRefCallback } from '@rocket.chat/ui-client';
import { useCallback, useRef } from 'react';

class DraggableElement extends Emitter<{
	dragStart: DOMRect;
	dragEnd: DOMRect;
}> {
	private element: HTMLElement;

	private isDragging = false;

	private offsetX = 0;

	private offsetY = 0;

	private currentTransform: {
		x: number;
		y: number;
	} = {
		x: 0,
		y: 0,
	};

	constructor(element: HTMLElement) {
		super();
		this.element = element;
		// this.init();
	}

	init(): () => void {
		this.setOffset(0, 0);

		const onDragStart = this.onDragStart.bind(this);
		const onDragMove = this.onDragMove.bind(this);
		const onDragEnd = this.onDragEnd.bind(this);

		this.element.addEventListener('mousedown', onDragStart);
		document.addEventListener('mousemove', onDragMove);
		document.addEventListener('mouseup', onDragEnd);

		return () => {
			this.element.removeEventListener('mousedown', onDragStart);
			document.removeEventListener('mousemove', onDragMove);
			document.removeEventListener('mouseup', onDragEnd);
		};
	}

	private onDragStart(e: MouseEvent): void {
		this.isDragging = true;
		const rect = this.element.getBoundingClientRect();
		this.setMouseOffset(e.clientX, e.clientY);
		this.emit('dragStart', rect);
	}

	private onDragMove(e: MouseEvent): void {
		if (!this.isDragging) return;

		const x = e.clientX - this.offsetX;
		const y = e.clientY - this.offsetY;

		this.addTransformOffset(x, y);
		this.setMouseOffset(e.clientX, e.clientY);
	}

	private onDragEnd(): void {
		this.isDragging = false;
		const rect = this.element.getBoundingClientRect();
		this.emit('dragEnd', rect);
		this.setMouseOffset(0, 0);
	}

	private setOffset(x: number, y: number): void {
		this.currentTransform.x = x;
		this.currentTransform.y = y;

		this.element.style.transform = `translate(${this.currentTransform.x}px, ${this.currentTransform.y}px)`;
	}

	private setMouseOffset(x: number, y: number): void {
		this.offsetX = x;
		this.offsetY = y;
	}

	addTransformOffset(x: number, y: number): void {
		this.setOffset(this.currentTransform.x + x, this.currentTransform.y + y);
	}

	getBoundingClientRect(): DOMRect {
		return this.element.getBoundingClientRect();
	}
}

class BoundingElement extends Emitter<{
	resize: void;
}> {
	private element: HTMLElement;

	private timeout: NodeJS.Timeout | null = null;

	private observer: ResizeObserver | null = null;

	constructor(element: HTMLElement) {
		super();
		this.element = element;
	}

	getBoundingClientRect(): DOMRect {
		return this.element.getBoundingClientRect();
	}

	onResize(callback: () => void): OffCallbackHandler {
		if (!this.observer) {
			this.observer = new ResizeObserver(this.handleResizeBoundindElement.bind(this));
			this.observer.observe(this.element);
		}

		const off = this.on('resize', callback);

		return () => {
			off();
			if (!this.has('resize')) {
				this.observer?.disconnect();
				this.observer = null;
			}
		};
	}

	handleResizeBoundindElement(): void {
		if (this.timeout) {
			clearTimeout(this.timeout);
		}

		this.timeout = setTimeout(() => {
			this.emit('resize');
		}, 250);
	}
}

function bindDraggableElement(draggableElement: DraggableElement, boundingElement: BoundingElement): void {
	const rect = draggableElement.getBoundingClientRect();
	const bounds = boundingElement.getBoundingClientRect();

	// If the draggable element's top/left position is less than
	// the bounding element's top/left position, the difference will be positive
	// This means we can just add this value to the draggable element's offset
	// to bring it back into bounds
	const topLeftPoint = {
		x: bounds.left - rect.left,
		y: bounds.top - rect.top,
	};

	// If the draggable element's bottom/right position is greater than
	// the bounding element's bottom/right position, the difference will be negative
	// This means we can just add this value to the draggable element's offset
	// to bring it back into bounds
	const bottomRightPoint = {
		x: bounds.right - rect.right,
		y: bounds.bottom - rect.bottom,
	};

	if (topLeftPoint.x > 0) {
		draggableElement.addTransformOffset(topLeftPoint.x, 0);
	}
	if (topLeftPoint.y > 0) {
		draggableElement.addTransformOffset(0, topLeftPoint.y);
	}
	if (bottomRightPoint.x < 0) {
		draggableElement.addTransformOffset(bottomRightPoint.x, 0);
	}
	if (bottomRightPoint.y < 0) {
		draggableElement.addTransformOffset(0, bottomRightPoint.y);
	}
}

export const useDraggable = () => {
	const draggableElementRef = useRef<DraggableElement | null>(null);
	const boundingElementRef = useRef<BoundingElement | null>(null);

	const draggableCallbackRef = useSafeRefCallback(
		useCallback((node: HTMLElement | null) => {
			if (!node) {
				return;
			}

			const draggableElement = new DraggableElement(node);
			draggableElementRef.current = draggableElement;

			const offNodeListeners = draggableElement.init();

			const off = draggableElement.on('dragEnd', () => {
				if (!boundingElementRef.current) {
					return;
				}
				bindDraggableElement(draggableElement, boundingElementRef.current);
			});

			return () => {
				offNodeListeners();
				off();
			};
		}, []),
	);

	const boundingCallbackRef = useSafeRefCallback(
		useCallback((node: HTMLElement | null) => {
			if (!node) {
				return;
			}

			const boundingElement = new BoundingElement(node);
			boundingElementRef.current = boundingElement;

			return boundingElement.onResize(() => {
				console.log('resize');
				if (!draggableElementRef.current) {
					return;
				}
				bindDraggableElement(draggableElementRef.current, boundingElement);
			});
		}, []),
	);

	return [draggableCallbackRef, boundingCallbackRef];
};
