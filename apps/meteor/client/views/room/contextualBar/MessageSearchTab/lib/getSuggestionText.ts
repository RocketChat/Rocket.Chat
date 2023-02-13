import type { MessageSearchSuggestion } from './MessageSearchSuggestion';

export const getSuggestionText = (suggestion?: MessageSearchSuggestion): string | undefined => {
	return suggestion?.text;
};
