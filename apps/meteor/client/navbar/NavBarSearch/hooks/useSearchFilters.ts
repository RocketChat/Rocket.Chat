import type {
	AppliedFilter,
	NavBarSearchFormValues,
	SearchFilterKey,
	SearchFilterMeta,
	SearchFilterSuggestion,
} from '@rocket.chat/ai-search';
import { createAppliedFilter, mergeAppliedFilters, parseSearchInput, removeAppliedFilter, removeDraftFilter } from '@rocket.chat/ai-search';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useFormContext, useWatch } from 'react-hook-form';

export const useSearchFilters = ({ aiSearchActive = false }: { aiSearchActive?: boolean } = {}) => {
	const { control, getValues, setValue, setFocus } = useFormContext<NavBarSearchFormValues>();
	const filters = useWatch({ control, name: 'filters' });

	const setFilters = useStableCallback((next: AppliedFilter[]) => {
		setValue('filters', next, { shouldDirty: true });
	});

	const applyFilters = useStableCallback((incoming: AppliedFilter[]) => {
		if (!incoming.length) {
			return;
		}

		setFilters(mergeAppliedFilters(getValues('filters'), incoming));
	});

	const removeFilter = useStableCallback((id: string) => {
		setFilters(removeAppliedFilter(getValues('filters'), id));
		setFocus('filterText');
	});

	const removeLastFilter = useStableCallback(() => {
		const current = getValues('filters');

		if (current.length) {
			setFilters(current.slice(0, -1));
		}
	});

	const clearFilters = useStableCallback(() => {
		setFilters([]);
		setFocus('filterText');
	});

	const clearQuery = useStableCallback(() => {
		setFilters([]);
		setValue('filterText', '', { shouldDirty: false });
	});

	const startFilter = useStableCallback((key: SearchFilterKey) => {
		const text = removeDraftFilter(getValues('filterText'));

		setValue('filterText', text ? `${text} ${key}:` : `${key}:`, { shouldDirty: true });
		setFocus('filterText');
	});

	const handleTextChange = useStableCallback((input: string) => {
		if (!aiSearchActive) {
			setValue('filterText', input, { shouldDirty: true });
			return;
		}

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
		filters,
		removeFilter,
		removeLastFilter,
		clearFilters,
		clearQuery,
		startFilter,
		handleTextChange,
		acceptSuggestion,
	};
};
