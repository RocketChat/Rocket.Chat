import { Box, Icon, TextInput } from '@rocket.chat/fuselage';
import { useAutoFocus, useMergedRefs } from '@rocket.chat/fuselage-hooks';
import type { ChangeEvent, ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

import { useIsCompactFilterBar } from './FilterBar';

export type FilterBarSearchProps = Omit<ComponentProps<typeof TextInput>, 'onChange' | 'endAddon'> & {
	shouldAutoFocus?: boolean;
	onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
};

/**
 * The text search of a filter bar. It takes the room the filters leave on its row.
 */
const FilterBarSearch = ({ placeholder, shouldAutoFocus = false, ref, ...props }: FilterBarSearchProps) => {
	const { t } = useTranslation();
	const autoFocusRef = useAutoFocus(shouldAutoFocus);
	const mergedRefs = useMergedRefs(ref, autoFocusRef);
	const compact = useIsCompactFilterBar();

	return (
		// A grow far above the filter group's keeps the filters at their base width while they share the search's row
		<Box display='flex' flexGrow={999} flexShrink={1} flexBasis={compact ? 0 : 'x280'} minWidth={compact ? 0 : 'x280'}>
			<TextInput
				{...props}
				placeholder={placeholder ?? t('Search')}
				ref={mergedRefs}
				endAddon={<Icon name='magnifier' size='x20' />}
				aria-label={props['aria-label'] ?? placeholder ?? t('Search')}
			/>
		</Box>
	);
};

export default FilterBarSearch;
