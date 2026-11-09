import { useContext, type InputEvent } from 'react';

import { Input } from '../InputBox';
import type { SelectAnchorParams } from './SelectAnchorParams';
import { SelectFilteredContext } from './SelectFilteredContext';

type SelectFilteredAnchorProps = SelectAnchorParams;

function SelectFilteredAnchor({ children: _children, ...props }: SelectFilteredAnchorProps) {
	const { placeholder, filter, setFilter } = useContext(SelectFilteredContext);

	return (
		<Input
			className='rcx-select__focus rcx-select__filter rcx-input-box--undecorated'
			placeholder={placeholder}
			value={filter}
			onInput={(e: InputEvent<HTMLInputElement>) => setFilter?.(e.currentTarget.value)}
			{...props}
		/>
	);
}

export default SelectFilteredAnchor;
