import { Emitter, OffCallbackHandler } from '@rocket.chat/emitter';
import { useSafeRefCallback } from '@rocket.chat/ui-client';
import { useCallback, useRef } from 'react';

const GRAB_DOM_EVENTS = ['pointerdown' /* , 'touchstart' */] as const;
const RELEASE_DOM_EVENTS = ['pointerup', 'pointercancel', 'lostpointercapture'] as const;
const MOVE_DOM_EVENTS = ['pointermove' /* , 'touchmove' */] as const;

interface PointCoordinates {
	x: number;
	y: number;
}

interface IGenericRect extends PointCoordinates {
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
	move: PointCoordinates;
	release: IGenericRect;
};

class Draggable extends Emitter<DraggableElementEvents> {
	private _element: IDraggableElement;

	private isDragging = false;

	private pointerCoordinates: PointCoordinates = { x: 0, y: 0 };

	private elementPositionOffset: PointCoordinates = { x: 0, y: 0 };

	// private lastKnownElementPosition: GenericRect = { x: 0, y: 0, width: 0, height: 0 };

	constructor(element: IDraggableElement) {
		console.count('constructor');
		super();
		this._element = element;
		this._element.onMove((pointerCoordinates) => {
			this.handleMove(pointerCoordinates);
		});

		this._element.onRelease((pointerCoordinates) => {
			this.handleRelease(pointerCoordinates);
		});
	}

	get element(): IDraggableElement {
		return this._element;
	}

	public onRelease(cb: (rect: IGenericRect) => void): OffCallbackHandler {
		console.count('release1');
		return this.on('release', cb);
	}

	public onMove(cb: (pointerPosition: PointCoordinates) => void): OffCallbackHandler {
		return this.on('move', cb);
	}

	private setPointerCoordinates(pointerCoordinates: PointCoordinates): void {
		this.pointerCoordinates = pointerCoordinates;
	}

	private addElementPositionOffset(x: number, y: number): void {
		const currentOffset = this.getCurrentOffset();
		this.setElementPositionOffset(currentOffset.x + x, currentOffset.y + y);
	}

	private setElementPositionOffset(x: number, y: number): void {
		this.elementPositionOffset = { x, y };
		this.element.setElementPositionOffset(this.elementPositionOffset);
	}

	public moveToCoordinates(targetElementCoordinates: PointCoordinates): void {
		const initialPosition = this._element.getElementRect();
		this.moveByOffset({
			x: targetElementCoordinates.x - initialPosition.x,
			y: targetElementCoordinates.y - initialPosition.y,
		});
	}

	public handleGrab(startingPointerCoordinates: PointCoordinates): void {
		this.isDragging = true;
		this.setPointerCoordinates(startingPointerCoordinates);
		this.emit('grab', this._element.getElementRect());
	}

	public handleMove(currentPointerCoordinates: PointCoordinates): void {
		if (!this.isDragging) return;

		const xDelta = currentPointerCoordinates.x - this.pointerCoordinates.x;
		const yDelta = currentPointerCoordinates.y - this.pointerCoordinates.y;

		this.addElementPositionOffset(xDelta, yDelta);
		this.setPointerCoordinates(currentPointerCoordinates);

		this.emit('move', this.getCurrentOffset());
		this.element.setElementPositionOffset(this.getCurrentOffset());
	}

	public handleRelease(finalElementPosition: IGenericRect): void {
		this.isDragging = false;
		this.setPointerCoordinates({ x: 0, y: 0 });
		this.emit('release', finalElementPosition);
	}

	public moveByOffset(offset: PointCoordinates): void {
		this.addElementPositionOffset(offset.x, offset.y);
		this.emit('move', this.getCurrentOffset());
	}

	public getCurrentOffset(): { x: number; y: number } {
		return this.elementPositionOffset;
	}
}

class BoundingElement extends Emitter<{
	resize: IGenericRect;
}> {
	private _element: IBoundingElement;

	private draggableInstance: Draggable;

	constructor(element: IBoundingElement, draggableInstance: Draggable) {
		super();
		this._element = element;
		this.draggableInstance = draggableInstance;

		this.draggableInstance.onRelease(() => {
			const offset = this.calculateBoundsOffset();
			this.draggableInstance.moveByOffset(offset);
		});

		this.element.onResize(() => {
			const offset = this.calculateBoundsOffset();
			this.draggableInstance.moveByOffset(offset);
		});
	}

	get element(): IBoundingElement {
		return this._element;
	}

	private calculateBoundsOffset(): PointCoordinates {
		const draggableRect = new GenericRect(this.draggableInstance.element.getElementRect());
		const boundsRect = new GenericRect(this.element.getElementRect());
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

		console.log('calculateBoundsOffset', draggableRect, boundsRect);
		console.log('calculateBoundsOffset', topLeftPoint, bottomRightPoint);
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
	grab: PointCoordinates;
}> {
	private draggableInstance: Draggable;

	private _element: IHandleElement;

	constructor(element: IHandleElement, draggableInstance: Draggable) {
		super();
		this.draggableInstance = draggableInstance;
		this._element = element;

		this._element.onGrab((mousePosition) => {
			this.draggableInstance.handleGrab(mousePosition);
		});
	}

	get element(): IHandleElement {
		return this._element;
	}
}

const getPointerEventCoordinates = (e: PointerEvent): PointCoordinates => ({
	x: e.clientX,
	y: e.clientY,
});

interface IDraggableElement {
	onMove(cb: (pointerPosition: PointCoordinates) => void): OffCallbackHandler;
	onRelease(cb: (rect: IGenericRect) => void): OffCallbackHandler;
	getElementRect(): IGenericRect;
	setElementPositionOffset(offset: PointCoordinates): void;
	setElement(element: unknown): OffCallbackHandler;
}

interface IBoundingElement {
	onResize(cb: (rect: IGenericRect) => void): OffCallbackHandler;
	getElementRect(): IGenericRect;
	setElement(element: unknown): OffCallbackHandler;
}

interface IHandleElement {
	onGrab(cb: (pointerCoordinates: PointCoordinates) => void): OffCallbackHandler;
	setElement(element: unknown): OffCallbackHandler;
}

class HandleDomElement
	extends Emitter<{
		grab: PointCoordinates;
	}>
	implements IHandleElement
{
	public setElement(element: HTMLElement) {
		const onGrab = (event: PointerEvent) => {
			this.emit('grab', getPointerEventCoordinates(event));
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

	public onGrab = (cb: (mousePosition: PointCoordinates) => void): OffCallbackHandler => {
		return this.on('grab', cb);
	};
}

class BoundingDomElement
	extends Emitter<{
		resize: IGenericRect;
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

		return () => observer.disconnect();
	}

	public onResize = (cb: (rect: IGenericRect) => void): OffCallbackHandler => {
		return this.on('resize', cb);
	};

	public getElementRect(): DOMRect {
		if (!this._element) {
			return new DOMRect();
		}

		return this._element.getBoundingClientRect();
	}
}

class DraggableDomElement extends Emitter<DraggableElementEvents> implements IDraggableElement {
	private element: HTMLElement | null = null;

	public setElement(element: HTMLElement) {
		this.element = element;

		const onEnd = () => {
			this.emit('release', this.getElementRect());
		};

		const onMove = (event: PointerEvent) => {
			this.emit('move', getPointerEventCoordinates(event));
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

		return () => unsubArray.forEach((unsub) => unsub());
	}

	public onMove = (cb: (pointerPosition: PointCoordinates) => void): OffCallbackHandler => {
		return this.on('move', cb);
	};

	public onRelease = (cb: (rect: IGenericRect) => void): OffCallbackHandler => {
		console.count('release2');
		return this.on('release', cb);
	};

	public getElementRect(): DOMRect {
		if (!this.element) {
			return new DOMRect();
		}

		return this.element.getBoundingClientRect();
	}

	public setElementPositionOffset(offset: PointCoordinates): void {
		if (!this.element) {
			return;
		}

		console.trace('setElementPositionOffset', offset);

		this.element.style.transform = `translate(${offset.x}px, ${offset.y}px)`;
	}
}

export const useDraggable = () => {
	// TODO these classes are being instantiated more than once.
	const draggableElementRef = useRef<Draggable>(new Draggable(new DraggableDomElement()));
	const boundingElementRef = useRef<BoundingElement>(new BoundingElement(new BoundingDomElement(), draggableElementRef.current));
	const handleElementRef = useRef<HandleElement>(new HandleElement(new HandleDomElement(), draggableElementRef.current));
	const restorePositionRef = useRef<IGenericRect | null>(null);

	const handleElementCallbackRef = useSafeRefCallback(
		useCallback((node: HTMLElement | null) => {
			if (!node) {
				return;
			}

			return handleElementRef.current.element.setElement(node);
		}, []),
	);

	const draggableCallbackRef = useSafeRefCallback(
		useCallback((node: HTMLElement | null) => {
			if (!node) {
				return;
			}

			const offDomEvents = draggableElementRef.current.element.setElement(node);
			// const offMove = draggableElementRef.current.onMove(() => {
			// 	restorePositionRef.current = node.getBoundingClientRect();
			// });

			if (restorePositionRef.current) {
				// draggableElementRef.current.moveToCoordinates(restorePositionRef.current);
			}

			return () => {
				offDomEvents();
				// offMove();
			};
		}, []),
	);

	const boundingCallbackRef = useSafeRefCallback(
		useCallback((node: HTMLElement | null) => {
			if (!node) {
				return;
			}

			return boundingElementRef.current.element.setElement(node);
		}, []),
	);

	return [draggableCallbackRef, boundingCallbackRef, handleElementCallbackRef];
};
