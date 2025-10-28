import { Emitter } from '@rocket.chat/emitter';

import type { StepMetadata } from './StepNode';
import StepNode from './StepNode';

/**
 * A doubly linked list implementation to manage the state of wizard steps.
 * It extends Emitter to notify about state changes.
 */
class StepsLinkedList extends Emitter<{ stateChanged: undefined }> {
	public head: StepNode | null = null;

	public tail: StepNode | null = null;

	private stepNodeMap: Map<string | number, StepNode> = new Map();

	/**
	 * Creates an instance of StepsLinkedList.
	 * @param steps - An array of step metadata to initialize the list with.
	 */
	constructor(steps: readonly StepMetadata[]) {
		super();
		steps.forEach((step) => this.append(step));
	}

	/**
	 * Appends a new step to the end of the list or updates an existing one.
	 * @param value - The metadata for the step to append or update.
	 * @returns The created or updated StepNode.
	 */
	public append(value: StepMetadata): StepNode {
		const existingStep = this.stepNodeMap.get(value.id);

		if (existingStep) {
			existingStep.value = value;
			this.notifyChanges();
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

	/**
	 * Removes a step from the list by its ID.
	 * @param id - The ID of the step to remove.
	 * @returns The removed StepNode, or null if not found.
	 */
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

	/**
	 * Enables a specific step.
	 * @param step - The StepNode to enable.
	 */
	public enableStep(step: StepNode) {
		step.enable();
		this.notifyChanges();
	}

	/**
	 * Disables a specific step.
	 * @param step - The StepNode to disable.
	 */
	public disableStep(step: StepNode) {
		step.disable();
		this.notifyChanges();
	}

	/**
	 * Emits a 'stateChanged' event to notify listeners of changes.
	 */
	private notifyChanges() {
		this.emit('stateChanged');
	}

	/**
	 * Retrieves a step by its ID.
	 * @param id - The ID of the step to retrieve.
	 * @returns The StepNode if found, otherwise null.
	 */
	public get(id: string | number): StepNode | null {
		const node = this.stepNodeMap.get(id);
		return node || null;
	}

	/**
	 * Converts the linked list to an array of StepNodes.
	 * @returns An array of all StepNodes in the list.
	 */
	public toArray(): StepNode[] {
		return Array.from(this.stepNodeMap.values());
	}

	/**
	 * Gets the total number of steps in the list.
	 */
	get size(): number {
		return this.stepNodeMap.size;
	}
}

export default StepsLinkedList;
