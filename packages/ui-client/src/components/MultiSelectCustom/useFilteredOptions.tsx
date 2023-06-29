import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from '@rocket.chat/ui-contexts';

import type { OptionProp } from './MultiSelectCustom';

export const useFilteredOptions = (optionSearch: string | undefined, options: OptionProp[]) => {
	const t = useTranslation();

	if (!optionSearch) return options;

	let filtered: OptionProp[] = [];

	options.forEach((option) => {
		if (
			t(option.text as TranslationKey)
				.toLowerCase()
				.includes(optionSearch.toLowerCase())
		) {
			filtered = [...filtered, option];
		}
	});

	return filtered;
};
