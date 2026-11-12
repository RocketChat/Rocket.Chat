import { use, type InputEvent } from 'react';

import type { SelectAnchorParams } from './SelectAnchorParams';
import SelectFilter from './SelectFilter';
import { SelectFilteredContext } from './SelectFilteredContext';

type SelectFilteredAnchorProps = SelectAnchorParams;

function SelectFilteredAnchor({ children: _children, ...props }: SelectFilteredAnchorProps) {
	const { placeholder, filter, setFilter } = use(SelectFilteredContext);

	return (
		<SelectFilter
			placeholder={placeholder}
			value={filter}
			onInput={(e: InputEvent<HTMLInputElement>) => setFilter?.(e.currentTarget.value)}
			{...props}
		/>
	);
}

export default SelectFilteredAnchor;
