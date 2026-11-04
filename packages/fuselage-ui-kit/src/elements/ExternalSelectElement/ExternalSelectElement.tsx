import { AutoComplete } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import { useCallback, useMemo, useState } from 'react';

import { useExternalSelectOptions } from './hooks/useExternalSelectOptions';
import { useAutoCompleteKey } from '../../hooks/useAutoCompleteKey';
import { useUiKitState } from '../../hooks/useUiKitState';
import type { BlockProps } from '../../utils/BlockProps';

export type ExternalSelectElementProps = BlockProps<UiKit.ExternalSelectElement>;

const ExternalSelectElement = ({ block, context }: ExternalSelectElementProps) => {
	const [{ value, loading }, action] = useUiKitState(block, context);
	const [filter, setFilter] = useState('');

	const initialOptions = useMemo(() => (block.initial_option ? [block.initial_option] : []), [block.initial_option]);
	const selected = useMemo(() => (value ? [value] : []), [value]);

	const data = useExternalSelectOptions({ block, filter, selected, initialOptions });
	const autoCompleteKey = useAutoCompleteKey(value, data);

	const handleChange = useCallback(
		(value: string | string[]) => {
			if (!Array.isArray(value)) void action({ target: { value } });
		},
		[action],
	);

	return (
		<AutoComplete
			key={autoCompleteKey}
			autoFocus={block.focus_on_load}
			value={value}
			placeholder={block.placeholder?.text}
			disabled={loading}
			options={data}
			onChange={handleChange}
			filter={filter}
			setFilter={setFilter}
		/>
	);
};

export default ExternalSelectElement;
