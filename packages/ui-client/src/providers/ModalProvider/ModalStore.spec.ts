import { modalStore } from './ModalStore';

afterEach(() => {
	while (modalStore.current) {
		modalStore.close();
	}
});

it('closes the modal of the instance, not the one on top of the stack', () => {
	const bottom = modalStore.open('bottom');
	modalStore.push('top');

	bottom.close();

	expect(modalStore.current?.node).toBe('top');
	modalStore.close();
	expect(modalStore.current).toBeNull();
});

it('cancels the modal of the instance, not the one on top of the stack', () => {
	const bottom = modalStore.open('bottom');
	modalStore.push('top');

	bottom.cancel();

	expect(modalStore.current?.node).toBe('top');
});

it('does nothing when the instance modal was already replaced', () => {
	const first = modalStore.open('first');
	modalStore.open('second');

	first.close();

	expect(modalStore.current?.node).toBe('second');
});

it('exposes the full stack via getStackSnapshot', () => {
	modalStore.open('bottom');
	modalStore.push('top');

	const stack = modalStore.getStackSnapshot();

	expect(stack).toHaveLength(2);
	expect(stack[0].node).toBe('bottom');
	expect(stack[1].node).toBe('top');
});

it('preserves stack entries when top is closed', () => {
	modalStore.open('first');
	modalStore.push('second');
	modalStore.push('third');

	modalStore.close();

	const stack = modalStore.getStackSnapshot();

	expect(stack).toHaveLength(2);
	expect(stack[0].node).toBe('first');
	expect(stack[1].node).toBe('second');
});

it('assigns stable ids to stack entries', () => {
	modalStore.open('a');
	modalStore.push('b');

	const stack = modalStore.getStackSnapshot();

	expect(typeof stack[0].id).toBe('number');
	expect(typeof stack[1].id).toBe('number');
	expect(stack[0].id).not.toBe(stack[1].id);
});
