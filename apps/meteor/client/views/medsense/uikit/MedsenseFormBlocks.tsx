import type * as UiKit from '@rocket.chat/ui-kit';

const OPTIONS_BLOCK_PREFIX = 'selection-form__options::';
const OPTIONS_MODAL_BLOCK_PREFIX = 'selection-form__options-modal::';
const SUBMIT_BLOCK_PREFIX = 'selection-form__submit::';
const NAV_BLOCK_PREFIX = 'selection-form__nav::';
const CUSTOM_BLOCK_PREFIX = 'selection-form__custom::';

const isActionId = (element: UiKit.ActionsBlock['elements'][number], actionId: string): boolean =>
	element.type === 'button' && element.actionId === actionId;

const hasPrefixedBlockId = (blockId: string | undefined, prefix: string): boolean => Boolean(blockId?.startsWith(prefix));

const isOptionAction = (block: UiKit.ActionsBlock): boolean =>
	hasPrefixedBlockId(block.blockId, OPTIONS_BLOCK_PREFIX) ||
	hasPrefixedBlockId(block.blockId, OPTIONS_MODAL_BLOCK_PREFIX) ||
	block.elements.some((element) => isActionId(element, 'selection-form__select') || isActionId(element, 'selection-form__modal-select'));

const isSubmitAction = (block: UiKit.ActionsBlock): boolean =>
	hasPrefixedBlockId(block.blockId, SUBMIT_BLOCK_PREFIX) ||
	block.elements.some((element) => isActionId(element, 'selection-form__inline-submit'));

const isNavAction = (block: UiKit.ActionsBlock): boolean =>
	hasPrefixedBlockId(block.blockId, NAV_BLOCK_PREFIX) ||
	block.elements.some((element) => isActionId(element, 'selection-form__prev') || isActionId(element, 'selection-form__next'));

const isSelectedOption = (blockId: string | undefined): boolean => blockId?.endsWith('::selected') || false;

export const getMedsenseActionsClassName = (block: UiKit.ActionsBlock): string => {
	const classNames = ['medsenseUIKit-actions'];

	if (isOptionAction(block)) {
		classNames.push('medsenseUIKit-actions--option');
		if (isSelectedOption(block.blockId)) {
			classNames.push('medsenseUIKit-actions--selected');
		}
	}

	if (isSubmitAction(block)) {
		classNames.push('medsenseUIKit-actions--submit');
	}

	if (isNavAction(block)) {
		classNames.push('medsenseUIKit-actions--nav');
	}

	return classNames.join(' ');
};

export const getMedsenseInputClassName = (block: UiKit.InputBlock): string => {
	const classNames = ['medsenseUIKit-inputRow'];

	if (hasPrefixedBlockId(block.blockId, CUSTOM_BLOCK_PREFIX)) {
		classNames.push('medsenseUIKit-inputRow--custom');
	}

	return classNames.join(' ');
};
