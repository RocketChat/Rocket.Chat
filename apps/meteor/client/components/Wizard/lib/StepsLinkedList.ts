import { Emitter } from '@rocket.chat/emitter';

export type StepMetadata = {
	id: string;
	title: string;
	onNext?(): void;
	onPrev?(): void;
};

export class StepNode {
	public value: StepMetadata;

	public next: StepNode | null = null;

	public prev: StepNode | null = null;

	public disabled = true;

	constructor(value: StepMetadata, disabled = true) {
		this.value = value;
		this.disabled = disabled;
	}

	enable() {
		this.disabled = false;
	}

	disable() {
		this.disabled = true;
	}

	get id() {
		return this.value.id;
	}

	get title() {
		return this.value.title;
	}

	onNext() {
		this.value.onNext?.();
	}

	onPrev() {
		this.value.onPrev?.();
	}
}

export class StepsLinkedList extends Emitter<{ stateChanged: undefined }> {
	public head: StepNode | null = null;

	public tail: StepNode | null = null;

	private stepNodeMap: Map<string | number, StepNode> = new Map();

	constructor(steps: StepMetadata[]) {
		super();
		steps.forEach((step) => this.append(step));
	}

	public append(value: StepMetadata): StepNode {
		const existingStep = this.stepNodeMap.get(value.id);

		if (existingStep) {
			existingStep.value = value;
			this.emit('stateChanged');
			return existingStep;
		}

		const newNode = new StepNode(value, !!this.head);
		if (!this.head) {
			this.head = newNode;
			this.tail = newNode;
		} else if (this.tail) {
			this.tail.next = newNode;
			newNode.prev = this.tail;
			this.tail = newNode;
		}

		this.stepNodeMap.set(value.id, newNode);
		this.notifyChanges();
		return newNode;
	}

	public remove(id: string | number): StepNode | null {
		const nodeToRemove = this.stepNodeMap.get(id);

		if (!nodeToRemove) {
			return null;
		}

		if (nodeToRemove.prev) {
			nodeToRemove.prev.next = nodeToRemove.next;
		} else {
			this.head = nodeToRemove.next;
		}

		if (nodeToRemove.next) {
			nodeToRemove.next.prev = nodeToRemove.prev;
		} else {
			this.tail = nodeToRemove.prev;
		}

		nodeToRemove.prev = null;
		nodeToRemove.next = null;

		this.stepNodeMap.delete(id);
		this.notifyChanges();
		return nodeToRemove;
	}

	public enableStep(step: StepNode) {
		step.enable();
		this.notifyChanges();
	}

	public disableStep(step: StepNode) {
		step.disable();
		this.notifyChanges();
	}

	private notifyChanges() {
		this.emit('stateChanged');
	}

	public get(id: string | number): StepNode | null {
		const node = this.stepNodeMap.get(id);
		return node || null;
	}

	public toArray(): StepNode[] {
		return Array.from(this.stepNodeMap.values());
	}

	get size(): number {
		return this.stepNodeMap.size;
	}
}
