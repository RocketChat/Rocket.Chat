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
