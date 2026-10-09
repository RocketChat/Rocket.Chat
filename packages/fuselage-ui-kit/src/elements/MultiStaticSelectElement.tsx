import type { SelectOption } from '@rocket.chat/fuselage';
import { MultiSelectFiltered } from '@rocket.chat/fuselage';
import { MultiSelectFiltered as FieldMultiSelectFiltered } from '@rocket.chat/fuselage-forms';
import * as UiKit from '@rocket.chat/ui-kit';
import { memo, useCallback, useMemo } from 'react';

import { useStringFromTextObject } from '../hooks/useStringFromTextObject';
import { useUiKitState } from '../hooks/useUiKitState';
import type { BlockProps } from '../utils/BlockProps';

export type MultiStaticSelectElementProps = BlockProps<UiKit.MultiStaticSelectElement>;

const MultiStaticSelectElement = ({ block, context }: MultiStaticSelectElementProps) => {
	const [{ loading, value, error }, action] = useUiKitState(block, context);
	const fromTextObjectToString = useStringFromTextObject();

	const options = useMemo<SelectOption[]>(
		() => block.options.map(({ value, text }) => [value, fromTextObjectToString(text) ?? '']),
		[block.options, fromTextObjectToString],
	);

	const handleChange = useCallback(
		(value: string[]) => {
			void action({ target: { value } });
		},
		[action],
	);

	const Select = context === UiKit.BlockContext.FORM ? FieldMultiSelectFiltered : MultiSelectFiltered;

	return (
		<Select
			value={value}
			disabled={loading}
			error={error}
			options={options}
			placeholder={fromTextObjectToString(block.placeholder)}
			onChange={handleChange}
		/>
	);
};

export default memo(MultiStaticSelectElement);
