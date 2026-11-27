import type { ComposerPopupOption } from '../../contexts/ComposerPopupContext';

type PopupTrigger = Pick<ComposerPopupOption, 'trigger' | 'triggerAnywhere' | 'triggerLength' | 'matchSelectorRegex'>;

const getPopupTriggerSelector = ({ trigger, triggerAnywhere, matchSelectorRegex }: PopupTrigger): RegExp =>
	matchSelectorRegex ?? (triggerAnywhere ? new RegExp(`(?:^|\\s)(${trigger})([^\\s]*$)`) : new RegExp(`(?:^)(${trigger})([^\\s]*$)`));

/**
 * The index of the first option whose trigger ends the text before the caret, or -1.
 */
export const findPopupOptionIndex = (options: readonly PopupTrigger[], textBeforeCaret: string): number =>
	options.findIndex((option) => {
		const selector = getPopupTriggerSelector(option);
		const result = selector.test(textBeforeCaret);
		if (!option.triggerLength || !result) {
			return result;
		}
		const filter = textBeforeCaret.match(selector);
		return filter && option.triggerLength < filter[0].length;
	});

/**
 * What the user typed after the option's trigger, the text the popup filters by.
 */
export const getPopupFilter = (option: PopupTrigger, textBeforeCaret: string): string | undefined => {
	const result = textBeforeCaret.match(getPopupTriggerSelector(option));
	return result ? result[2] : '';
};

/**
 * The span of text before the caret, trigger included, that choosing an item replaces.
 * The caret is the composer's own selection offset: it can differ from the length of the text before it.
 */
export const getPopupReplaceRange = (
	option: PopupTrigger,
	textBeforeCaret: string,
	caret: number,
): { start: number; end: number } | undefined => {
	const result = textBeforeCaret.match(getPopupTriggerSelector(option));
	if (!result) {
		return undefined;
	}

	return { start: textBeforeCaret.lastIndexOf(result[1] + result[2]), end: caret };
};
