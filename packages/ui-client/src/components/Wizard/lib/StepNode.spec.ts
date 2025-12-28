import StepNode, { type StepMetadata } from './StepNode';

describe('StepNode', () => {
	const baseMetadata: StepMetadata = { id: 'step1', title: 'Step 1' };

	it('should correctly initialize with provided value and default disabled state', () => {
		const node = new StepNode(baseMetadata);
		expect(node.value).toEqual(baseMetadata);
		expect(node.next).toBeNull();
		expect(node.prev).toBeNull();
		expect(node.disabled).toBe(true);
	});

	it('should allow overriding the default disabled state via constructor', () => {
		const node = new StepNode(baseMetadata, false);
		expect(node.disabled).toBe(false);
	});

	it('should return the correct id via the id getter', () => {
		const node = new StepNode(baseMetadata);
		expect(node.id).toBe(baseMetadata.id);
	});

	it('should return the correct title via the title getter', () => {
		const node = new StepNode(baseMetadata);
		expect(node.title).toBe(baseMetadata.title);
	});

	it('should enable the node when enable() is called', () => {
		const node = new StepNode(baseMetadata, true);
		node.enable();
		expect(node.disabled).toBe(false);
	});

	it('should disable the node when disable() is called', () => {
		const node = new StepNode(baseMetadata, false);
		node.disable();
		expect(node.disabled).toBe(true);
	});
});
