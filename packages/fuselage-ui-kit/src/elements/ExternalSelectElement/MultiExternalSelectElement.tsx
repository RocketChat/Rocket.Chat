import { AutoComplete } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import { memo, useCallback, useState } from 'react';

import { useExternalSelectOptions } from './hooks/useExternalSelectOptions.js';
import { useAutoCompleteKey } from '../../hooks/useAutoCompleteKey.js';
import { useUiKitState } from '../../hooks/useUiKitState.js';
import type { BlockProps } from '../../utils/BlockProps.js';
import { limitOptions } from '../../utils/limitOptions.js';

export type MultiExternalSelectElementProps = BlockProps<UiKit.MultiExternalSelectElement>;

const MultiExternalSelectElement = ({ block, context }: MultiExternalSelectElementProps) => {
	const [{ value, loading, error }, action] = useUiKitState(block, context);
	const [filter, setFilter] = useState('');

	const data = useExternalSelectOptions({ block, filter, selected: value ?? [], initialOptions: block.initial_options });
	const autoCompleteKey = useAutoCompleteKey(value, data);

	const handleChange = useCallback(
		(value: string | string[]) => {
			if (Array.isArray(value)) void action({ target: { value } });
		},
		[action],
	);

	return (
		<AutoComplete
			key={autoCompleteKey}
			autoFocus={block.focus_on_load}
			value={value || []}
			options={limitOptions(data, value, block.max_selected_items)}
			placeholder={block.placeholder?.text}
			disabled={loading}
			error={!!error}
			filter={filter}
			setFilter={setFilter}
			onChange={handleChange}
			multiple
		/>
	);
};

export default memo(MultiExternalSelectElement);
