export type ModalViewState = Record<string, Record<string, unknown>>;

type ViewBlock = { type: string; blockId?: string; element?: Record<string, any>; [key: string]: any };

const initialValueOf = (element: Record<string, any>): unknown =>
	element.initialValue ?? element.initialOption?.value ?? element.initialDate ?? undefined;

export const isInputElementBlock = (blocks: ViewBlock[], blockId: string, actionId: string) =>
	blocks.some((block) => block.type === 'input' && block.blockId === blockId && block.element?.actionId === actionId);

/** The values the visitor sees: each input's initial value, replaced by what they changed. */
export const createModalState = (blocks: ViewBlock[], changes: ModalViewState): ModalViewState => {
	const state: ModalViewState = {};

	for (const { type, blockId, element } of blocks) {
		if (type !== 'input' || !blockId || !element) {
			continue;
		}
		const value = changes[blockId]?.[element.actionId] ?? initialValueOf(element);
		if (value !== undefined) {
			state[blockId] = { [element.actionId]: value };
		}
	}

	return state;
};

export const recordInput = (state: ModalViewState, blockId: string, actionId: string, payload: Record<string, any>): ModalViewState => ({
	...state,
	[blockId]: { ...state[blockId], [actionId]: payload.value ?? payload.selectedDate },
});
