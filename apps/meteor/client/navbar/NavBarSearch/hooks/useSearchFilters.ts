import type {
	AppliedFilter,
	NavBarSearchFormValues,
	SearchFilterKey,
	SearchFilterMeta,
	SearchFilterSuggestion,
} from '@rocket.chat/ai-search';
import { createAppliedFilter, mergeAppliedFilters, parseSearchInput, removeDraftFilter } from '@rocket.chat/ai-search';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useFieldArray, useFormContext } from 'react-hook-form';

export const useSearchFilters = () => {
	const { control, getValues, setValue, setFocus } = useFormContext<NavBarSearchFormValues>();
	const { fields, remove, replace } = useFieldArray({ control, name: 'filters', keyName: 'fieldId' });

	const applyFilters = useStableCallback((incoming: AppliedFilter[]) => {
		if (!incoming.length) {
			return;
		}

		replace(mergeAppliedFilters(getValues('filters'), incoming));
	});

	const addFilter = useStableCallback((key: SearchFilterKey, rawValue: string, meta?: SearchFilterMeta) => {
		const filter = createAppliedFilter(key, rawValue, meta);

		if (filter) {
			applyFilters([filter]);
		}
	});

	const removeFilter = useStableCallback((id: string) => {
		const index = getValues('filters').findIndex((filter) => filter.id === id);

		if (index !== -1) {
			remove(index);
		}

		setFocus('filterText');
	});

	const removeLastFilter = useStableCallback(() => {
		const count = getValues('filters').length;

		if (count) {
			remove(count - 1);
		}
	});

	const clearFilters = useStableCallback(() => {
		replace([]);
		setFocus('filterText');
	});

	const clearQuery = useStableCallback(() => {
		replace([]);
		setValue('filterText', '', { shouldDirty: false });
	});

	const startFilter = useStableCallback((key: SearchFilterKey) => {
		const text = removeDraftFilter(getValues('filterText'));

		setValue('filterText', text ? `${text} ${key}:` : `${key}:`, { shouldDirty: true });
		setFocus('filterText');
	});

	const handleTextChange = useStableCallback((input: string) => {
		const { text, filters } = parseSearchInput(input, { keepDraft: true });

		applyFilters(filters);
		setValue('filterText', text, { shouldDirty: true });
	});

	const acceptSuggestion = useStableCallback((suggestion: SearchFilterSuggestion) => {
		const filter = createAppliedFilter(suggestion.filterKey, suggestion.value, suggestion.meta);

		if (!filter) {
			setFocus('filterText');
			return;
		}

		applyFilters([filter]);
		setValue('filterText', removeDraftFilter(getValues('filterText')), { shouldDirty: true });
		setFocus('filterText');
	});

	return {
		filters: fields,
		addFilter,
		removeFilter,
		removeLastFilter,
		clearFilters,
		clearQuery,
		startFilter,
		handleTextChange,
		acceptSuggestion,
	};
};
