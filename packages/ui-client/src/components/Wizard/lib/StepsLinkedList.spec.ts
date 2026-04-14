import type { StepMetadata } from './StepNode';
import StepsLinkedList from './StepsLinkedList';

describe('StepsLinkedList', () => {
	const steps: StepMetadata[] = [
		{ id: '1', title: 'Step 1' },
		{ id: '2', title: 'Step 2' },
		{ id: '3', title: 'Step 3' },
	];

	it('should initialize with a list of steps', () => {
		const list = new StepsLinkedList(steps);
		expect(list.size).toBe(3);
		expect(list.head?.id).toBe('1');
		expect(list.tail?.id).toBe('3');
		expect(list.head?.disabled).toBe(false);
		expect(list.head?.next?.disabled).toBe(true);
	});

	it('should append a new step to the list', () => {
		const list = new StepsLinkedList([]);
		list.append({ id: '1', title: 'Step 1' });
		expect(list.size).toBe(1);
		expect(list.head?.id).toBe('1');
		expect(list.tail?.id).toBe('1');

		list.append({ id: '2', title: 'Step 2' });
		expect(list.size).toBe(2);
		expect(list.tail?.id).toBe('2');
		expect(list.tail?.prev?.id).toBe('1');
		expect(list.head?.next?.id).toBe('2');
	});

	it('should update an existing step if append is called with an existing id', () => {
		const list = new StepsLinkedList([{ id: '1', title: 'Old Title' }]);
		const stateChangeListener = jest.fn();
		list.on('stateChanged', stateChangeListener);

		list.append({ id: '1', title: 'New Title' });

		expect(list.size).toBe(1);
		expect(list.get('1')?.title).toBe('New Title');
		expect(stateChangeListener).toHaveBeenCalledTimes(1);
	});

	it('should remove a step from the list', () => {
		const list = new StepsLinkedList(steps);
		const removedNode = list.remove('2');

		expect(removedNode?.id).toBe('2');
		expect(list.size).toBe(2);
		expect(list.get('2')).toBeNull();
		expect(list.head?.next?.id).toBe('3');
		expect(list.tail?.prev?.id).toBe('1');
	});

	it('should handle removing the head node', () => {
		const list = new StepsLinkedList(steps);
		list.remove('1');
		expect(list.head?.id).toBe('2');
		expect(list.head?.prev).toBeNull();
		expect(list.size).toBe(2);
	});

	it('should handle removing the tail node', () => {
		const list = new StepsLinkedList(steps);
		list.remove('3');
		expect(list.tail?.id).toBe('2');
		expect(list.tail?.next).toBeNull();
		expect(list.size).toBe(2);
	});

	it('should return null when trying to remove a non-existent node', () => {
		const list = new StepsLinkedList(steps);
		const result = list.remove('4');
		expect(result).toBeNull();
		expect(list.size).toBe(3);
	});

	it('should retrieve a step by its id', () => {
		const list = new StepsLinkedList(steps);
		const node = list.get('2');
		expect(node).not.toBeNull();
		expect(node?.id).toBe('2');
	});

	it('should return null if a step id does not exist', () => {
		const list = new StepsLinkedList(steps);
		const node = list.get('non-existent');
		expect(node).toBeNull();
	});

	it('should convert the list to an array', () => {
		const list = new StepsLinkedList(steps);
		const array = list.toArray();
		expect(Array.isArray(array)).toBe(true);
		expect(array.length).toBe(3);
		expect(array.map((node) => node.id)).toEqual(['1', '2', '3']);
	});

	it('should notify listeners on state changes', () => {
		const list = new StepsLinkedList([]);
		const stateChangeListener = jest.fn();
		list.on('stateChanged', stateChangeListener);

		list.append({ id: '1', title: 'Step 1' }); // 1
		list.append({ id: '2', title: 'Step 2' }); // 2
		const step2 = list.get('2');
		if (step2) {
			list.enableStep(step2); // 3
			list.disableStep(step2); // 4
		}
		list.remove('1'); // 5

		expect(stateChangeListener).toHaveBeenCalledTimes(5);
	});
});
