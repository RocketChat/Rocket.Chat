import { Emitter } from '@rocket.chat/emitter';
import type { OffCallbackHandler } from '@rocket.chat/emitter';
import { useSafeRefCallback } from '@rocket.chat/ui-client';
import { useCallback, useRef, useState } from 'react';

const GRAB_DOM_EVENTS = ['pointerdown'] as const;
const RELEASE_DOM_EVENTS = ['pointerup', 'pointercancel', 'lostpointercapture'] as const;
const MOVE_DOM_EVENTS = ['pointermove'] as const;

interface IPointCoordinates {
	x: number;
	y: number;
}

interface IGenericRect extends IPointCoordinates {
	width: number;
	height: number;
}

class GenericRect {
	private rect: IGenericRect;

	constructor(rect: IGenericRect) {
		this.rect = rect;
	}

	get x(): number {
		return this.rect.x;
	}

	get y(): number {
		return this.rect.y;
	}

	get width(): number {
		return this.rect.width;
	}

	get height(): number {
		return this.rect.height;
	}

	get top(): number {
		return this.rect.y;
	}

	get left(): number {
		return this.rect.x;
	}

	get right(): number {
		return this.rect.x + this.rect.width;
	}

	get bottom(): number {
		return this.rect.y + this.rect.height;
	}
}

type DraggableElementEvents = {
	grab: IGenericRect;
	move: IPointCoordinates;
	release: IGenericRect;
	changeView: IDraggableElement;
	resize: IGenericRect;
};

class Draggable extends Emitter<DraggableElementEvents> {
	private _element: IDraggableElement;

	private isDragging = false;

	private pointerCoordinates: IPointCoordinates = { x: 0, y: 0 };

	private storedPositionOffset: IPointCoordinates = { x: 0, y: 0 };

	constructor(element: IDraggableElement) {
		super();
		this._element = element;
		this._element.onMove((pointerCoordinates) => {
			this.handleMove(pointerCoordinates);
		});

		this._element.onRelease((rect) => {
			this.handleRelease(rect);
		});

		this._element.onChangeView((draggableElement) => {
			this.emit('changeView', draggableElement);
		});

		this._element.onResize((rect) => {
			this.emit('resize', rect);
		});
	}

	get element(): IDraggableElement {
		return this._element;
	}

	public onRelease(cb: (rect: IGenericRect) => void): OffCallbackHandler {
		return this.on('release', cb);
	}

	public onMove(cb: (pointerPosition: IPointCoordinates) => void): OffCallbackHandler {
		return this.on('move', cb);
	}

	public onResize(cb: (rect: IGenericRect) => void): OffCallbackHandler {
		return this.on('resize', cb);
	}

	public onChangeView(cb: (element: IDraggableElement) => void): OffCallbackHandler {
		return this.on('changeView', cb);
	}

	private setPointerCoordinates(pointerCoordinates: IPointCoordinates): void {
		this.pointerCoordinates = pointerCoordinates;
	}

	private addElementPositionOffset(x: number, y: number): void {
		const currentOffset = this.getStoredOffset();
		this.setStoredPositionOffset(currentOffset.x + x, currentOffset.y + y);
	}

	private setStoredPositionOffset(x: number, y: number): void {
		this.storedPositionOffset = { x, y };
		this.element.setElementPositionOffset(this.storedPositionOffset);
	}

	public moveToCoordinates(targetElementCoordinates: IPointCoordinates, initialPosition: IGenericRect): void {
		this.setStoredPositionOffset(targetElementCoordinates.x - initialPosition.x, targetElementCoordinates.y - initialPosition.y);
		this.emit('move', this.getStoredOffset());
	}

	public handleGrab(startingPointerCoordinates: IPointCoordinates, elementRect: IGenericRect): void {
		this.isDragging = true;
		this.setPointerCoordinates(startingPointerCoordinates);
		this.emit('grab', elementRect);
	}

	public handleMove(currentPointerCoordinates: IPointCoordinates): void {
		if (!this.isDragging) return;

		const xDelta = currentPointerCoordinates.x - this.pointerCoordinates.x;
		const yDelta = currentPointerCoordinates.y - this.pointerCoordinates.y;

		this.addElementPositionOffset(xDelta, yDelta);
		this.setPointerCoordinates(currentPointerCoordinates);

		const storedOffset = this.getStoredOffset();
		this.element.setElementPositionOffset(storedOffset);
		this.emit('move', storedOffset);
	}

	public handleRelease(finalElementPosition: IGenericRect): void {
		if (!this.isDragging) {
			return;
		}

		this.isDragging = false;
		this.setPointerCoordinates({ x: 0, y: 0 });
		this.emit('release', finalElementPosition);
	}

	public moveByOffset(offset: IPointCoordinates): void {
		this.addElementPositionOffset(offset.x, offset.y);
		this.emit('move', this.getStoredOffset());
	}

	public getStoredOffset(): IPointCoordinates {
		return this.storedPositionOffset;
	}
}

type BoundingElementOptions = {
	resizeDebounce: number; // debounce time in ms
};

export const DEFAULT_BOUNDING_ELEMENT_OPTIONS: BoundingElementOptions = {
	resizeDebounce: 150,
};

class BoundingElement extends Emitter<{
	resize: IGenericRect;
}> {
	private _element: IBoundingElement;

	private draggableInstance: Draggable;

	private resizeDebounce: number;

	private timeout: NodeJS.Timeout | null = null;

	constructor(element: IBoundingElement, draggableInstance: Draggable, options = DEFAULT_BOUNDING_ELEMENT_OPTIONS) {
		super();
		this._element = element;
		this.draggableInstance = draggableInstance;
		this.resizeDebounce = options.resizeDebounce;

		this.draggableInstance.onRelease(() => {
			this.tryMoveToBounds();
		});

		this.element.onResize(() => {
			this.tryMoveToBounds();
		});

		this.draggableInstance.onResize(() => {
			this.tryMoveToBounds();
		});

		this.draggableInstance.onChangeView(() => {
			this.tryMoveToBounds();
		});

		this.element.onChangeView(() => {
			this.tryMoveToBounds();
		});
	}

	get element(): IBoundingElement {
		return this._element;
	}

	private _tryMoveToBounds(): void {
		const draggableRect = this.draggableInstance.element.getElementRect();
		const boundsRect = this.element.getElementRect();
		if (!draggableRect || !boundsRect) {
			return;
		}

		const offset = this.calculateBoundsOffset(draggableRect, boundsRect);
		this.draggableInstance.moveByOffset(offset);
	}

	private tryMoveToBounds(): void {
		if (this.timeout) {
			clearTimeout(this.timeout);
		}

		this.timeout = setTimeout(() => {
			this._tryMoveToBounds();
		}, this.resizeDebounce);
	}

	private calculateBoundsOffset(_draggableRect: IGenericRect, _boundsRect: IGenericRect): IPointCoordinates {
		const draggableRect = new GenericRect(_draggableRect);
		const boundsRect = new GenericRect(_boundsRect);
		// If the draggable element's top/left position is less than
		// the bounding element's top/left position, the difference will be positive
		// This means we can just add this value to the draggable element's offset
		// to bring it back into bounds
		const topLeftPoint = {
			x: boundsRect.left - draggableRect.left,
			y: boundsRect.top - draggableRect.top,
		};

		// If the draggable element's bottom/right position is greater than
		// the bounding element's bottom/right position, the difference will be negative
		// This means we can just add this value to the draggable element's offset
		// to bring it back into bounds
		const bottomRightPoint = {
			x: boundsRect.right - draggableRect.right,
			y: boundsRect.bottom - draggableRect.bottom,
		};

		const offset = {
			x: 0,
			y: 0,
		};

		if (topLeftPoint.x > 0) {
			offset.x += topLeftPoint.x;
		}
		if (topLeftPoint.y > 0) {
			offset.y += topLeftPoint.y;
		}
		if (bottomRightPoint.x < 0) {
			offset.x += bottomRightPoint.x;
		}
		if (bottomRightPoint.y < 0) {
			offset.y += bottomRightPoint.y;
		}

		return offset;
	}
}

class HandleElement extends Emitter<{
	grab: IPointCoordinates;
}> {
	private draggableInstance: Draggable;

	private _element: IHandleElement;

	constructor(element: IHandleElement, draggableInstance: Draggable) {
		super();
		this.draggableInstance = draggableInstance;
		this._element = element;

		this._element.onGrab(([mousePosition, elementRect]) => {
			this.draggableInstance.handleGrab(mousePosition, elementRect);
		});
	}

	get element(): IHandleElement {
		return this._element;
	}
}

const getPointerEventCoordinates = (e: PointerEvent): IPointCoordinates => ({
	x: e.clientX,
	y: e.clientY,
});

type GetElementRect = () => IGenericRect | null;
type OnChangeView<TElement> = (cb: (element: TElement) => void) => OffCallbackHandler;

interface IDraggableElement {
	setElement(element: unknown): OffCallbackHandler;
	setElementPositionOffset(offset: IPointCoordinates): void;
	getElementRect: GetElementRect;
	// events
	onMove(cb: (pointerPosition: IPointCoordinates) => void): OffCallbackHandler;
	onChangeView: OnChangeView<IDraggableElement>;
	onRelease(cb: (rect: IGenericRect) => void): OffCallbackHandler;
	onResize(cb: (rect: IGenericRect) => void): OffCallbackHandler;
}

interface IBoundingElement {
	setElement(element: unknown): OffCallbackHandler;
	getElementRect: GetElementRect;
	// events
	onResize(cb: (rect: IGenericRect) => void): OffCallbackHandler;
	onChangeView: OnChangeView<IBoundingElement>;
}

interface IHandleElement {
	setElement(element: unknown): OffCallbackHandler;
	// events
	onGrab(cb: (event: [mousePosition: IPointCoordinates, elementRect: IGenericRect]) => void): OffCallbackHandler;
}

const isLeftClick = (event: PointerEvent) => event.button === 0;
const isMousePointer = (event: PointerEvent) => event.pointerType === 'mouse';

class HandleDomElement
	extends Emitter<{
		grab: [IPointCoordinates, IGenericRect];
	}>
	implements IHandleElement
{
	public setElement(element: HTMLElement) {
		const onGrab = (event: PointerEvent) => {
			const element = event.currentTarget as HTMLElement;
			if (!element || (isMousePointer(event) && !isLeftClick(event))) {
				return;
			}
			event.preventDefault();

			this.emit('grab', [getPointerEventCoordinates(event), element.getBoundingClientRect()]);
		};

		const unsubArray: OffCallbackHandler[] = [];

		unsubArray.push(
			...GRAB_DOM_EVENTS.map((event) => {
				element.addEventListener(event, onGrab);
				return () => element.removeEventListener(event, onGrab);
			}),
		);

		return () => unsubArray.forEach((unsub) => unsub());
	}

	public onGrab = (cb: (event: [mousePosition: IPointCoordinates, elementRect: IGenericRect]) => void): OffCallbackHandler => {
		return this.on('grab', cb);
	};
}

class BoundingDomElement
	extends Emitter<{
		resize: IGenericRect;
		changeView: IBoundingElement;
	}>
	implements IBoundingElement
{
	private _element: HTMLElement | null = null;

	public setElement(element: HTMLElement) {
		this._element = element;

		const onResize = (entries: ResizeObserverEntry[]) => {
			const firstEntry = entries[0];
			if (!firstEntry) {
				return;
			}

			this.emit('resize', firstEntry.contentRect);
		};

		const observer = new ResizeObserver(onResize);
		observer.observe(element);

		this.emit('changeView', this);
		return () => {
			observer.disconnect();
			this._element = null;
		};
	}

	public onResize = (cb: (rect: IGenericRect) => void): OffCallbackHandler => {
		return this.on('resize', cb);
	};

	public onChangeView = (cb: (element: IBoundingElement) => void): OffCallbackHandler => {
		return this.on('changeView', cb);
	};

	public getElementRect(): DOMRect | null {
		if (!this._element) {
			return null;
		}

		return this._element.getBoundingClientRect();
	}
}

type DraggableDomElementEvents = {
	changeView: IDraggableElement;
} & Pick<DraggableElementEvents, 'move' | 'release' | 'resize'>;

class DraggableDomElement extends Emitter<DraggableDomElementEvents> implements IDraggableElement {
	private element: HTMLElement | null = null;

	public setElement(element: HTMLElement) {
		this.element = element;

		const onEnd = () => {
			const elementRect = this.getElementRect();
			if (!elementRect) {
				return;
			}

			this.emit('release', elementRect);
		};

		const onMove = (event: PointerEvent) => {
			this.emit('move', getPointerEventCoordinates(event));
		};

		const onResize = (entries: ResizeObserverEntry[]) => {
			const firstEntry = entries[0];
			if (!firstEntry) {
				return;
			}

			this.emit('resize', firstEntry.contentRect);
		};

		const unsubArray: OffCallbackHandler[] = [];

		// Attach MOVE DOM listeners
		unsubArray.push(
			...MOVE_DOM_EVENTS.map((event) => {
				window.addEventListener(event, onMove);
				return () => window.removeEventListener(event, onMove);
			}),
		);

		// Attach RELEASE DOM listeners
		unsubArray.push(
			...RELEASE_DOM_EVENTS.map((event) => {
				window.addEventListener(event, onEnd);
				return () => window.removeEventListener(event, onEnd);
			}),
		);

		const observer = new ResizeObserver(onResize);
		observer.observe(element);

		unsubArray.push(() => observer.disconnect());

		this.emit('changeView', this);

		return () => {
			this.element = null;
			unsubArray.forEach((unsub) => unsub());
		};
	}

	public onResize = (cb: (rect: IGenericRect) => void): OffCallbackHandler => {
		return this.on('resize', cb);
	};

	public onChangeView = (cb: (element: IDraggableElement) => void): OffCallbackHandler => {
		return this.on('changeView', cb);
	};

	public onMove = (cb: (pointerPosition: IPointCoordinates) => void): OffCallbackHandler => {
		return this.on('move', cb);
	};

	public onRelease = (cb: (rect: IGenericRect) => void): OffCallbackHandler => {
		return this.on('release', cb);
	};

	public getElementRect(): DOMRect | null {
		if (!this.element) {
			return null;
		}

		return this.element.getBoundingClientRect();
	}

	public setElementPositionOffset(offset: IPointCoordinates): void {
		if (!this.element) {
			return;
		}

		this.element.style.transform = `translate(${offset.x}px, ${offset.y}px)`;
	}
}

export const useDraggable = () => {
	const [draggableElement] = useState<Draggable>(() => new Draggable(new DraggableDomElement()));
	const [boundingElement] = useState<BoundingElement>(() => new BoundingElement(new BoundingDomElement(), draggableElement));
	const [handleElement] = useState<HandleElement>(() => new HandleElement(new HandleDomElement(), draggableElement));
	const restorePositionRef = useRef<IGenericRect | null>(null);

	const handleElementCallbackRef = useSafeRefCallback(
		useCallback(
			(node: HTMLElement | null) => {
				if (!node) {
					return;
				}

				return handleElement.element.setElement(node);
			},
			[handleElement],
		),
	);

	const draggableCallbackRef = useSafeRefCallback(
		useCallback(
			(node: HTMLElement | null) => {
				if (!node) {
					return;
				}

				const offMove = draggableElement.onMove(() => {
					restorePositionRef.current = node.getBoundingClientRect();
				});

				const offDomEvents = draggableElement.element.setElement(node);

				if (restorePositionRef.current) {
					draggableElement.moveToCoordinates(restorePositionRef.current, node.getBoundingClientRect());
				}

				return () => {
					offDomEvents();
					offMove();
				};
			},
			[draggableElement],
		),
	);

	const boundingCallbackRef = useSafeRefCallback(
		useCallback(
			(node: HTMLElement | null) => {
				if (!node) {
					return;
				}

				return boundingElement.element.setElement(node);
			},
			[boundingElement],
		),
	);

	return [draggableCallbackRef, boundingCallbackRef, handleElementCallbackRef];
};
