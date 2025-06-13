import { Emitter } from '@rocket.chat/emitter';

interface IIdentifiable {
	id: string | number;
}

export class StepNode<T extends IIdentifiable> {
	public value: T;

	public next: StepNode<T> | null = null;

	public prev: StepNode<T> | null = null;

	constructor(value: T) {
		this.value = value;
	}
}

export class StepsLinkedList<T extends IIdentifiable> extends Emitter<{ stateChanged: undefined }> {
	private _head: StepNode<T> | null = null;

	private _tail: StepNode<T> | null = null;

	private stepNodeMap: Map<string | number, StepNode<T>> = new Map();

	public append(value: T): boolean {
		const existingStep = this.stepNodeMap.get(value.id);

		if (existingStep) {
			existingStep.value = value;
			this.emit('stateChanged');
			return true;
		}

		const newNode = new StepNode(value);
		if (!this._head) {
			this._head = newNode;
			this._tail = newNode;
		} else if (this._tail) {
			this._tail.next = newNode;
			newNode.prev = this._tail;
			this._tail = newNode;
		}

		this.stepNodeMap.set(value.id, newNode);
		this.emit('stateChanged');
		return true;
	}

	public remove(id: string | number): T | null {
		const nodeToRemove = this.stepNodeMap.get(id);

		if (!nodeToRemove) {
			return null;
		}

		if (nodeToRemove.prev) {
			nodeToRemove.prev.next = nodeToRemove.next;
		} else {
			this._head = nodeToRemove.next;
		}

		if (nodeToRemove.next) {
			nodeToRemove.next.prev = nodeToRemove.prev;
		} else {
			this._tail = nodeToRemove.prev;
		}

		nodeToRemove.prev = null;
		nodeToRemove.next = null;

		this.stepNodeMap.delete(id);
		this.emit('stateChanged');
		return nodeToRemove.value;
	}

	public get(id: string | number): StepNode<T> | null {
		const node = this.stepNodeMap.get(id);
		return node || null;
	}

	get head() {
		return this._head;
	}

	public toArray(): StepNode<T>[] {
		return Array.from(this.stepNodeMap.values());
	}

	get size(): number {
		return this.stepNodeMap.size;
	}
}
