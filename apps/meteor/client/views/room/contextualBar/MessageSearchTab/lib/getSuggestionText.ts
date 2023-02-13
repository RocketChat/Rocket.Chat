import type { MessageSearchSuggestion as MessageSearchSuggestionType } from './MessageSearchSuggestion';

export const getSuggestionText = (suggestion?: MessageSearchSuggestionType): string | undefined => {
	if (!suggestion) {
		return undefined;
	}

	return 'text' in suggestion ? suggestion.text : suggestion.action();
};
