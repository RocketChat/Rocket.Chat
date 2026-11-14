import { use, type InputEvent } from 'react';

import { Input } from '../InputBox';
import type { MultiSelectAnchorParams } from './MultiSelectAnchorParams';
import { MultiSelectFilteredContext } from './MultiSelectFilteredContext';

type MultiSelectFilteredAnchorProps = MultiSelectAnchorParams;

function MultiSelectFilteredAnchor({ children: _children, ...props }: MultiSelectFilteredAnchorProps) {
	const { placeholder, filter, setFilter } = use(MultiSelectFilteredContext);

	return (
		<Input
			placeholder={placeholder}
			value={filter}
			onInput={(e: InputEvent<HTMLInputElement>) => setFilter?.(e.currentTarget.value)}
			{...props}
			undecorated
			className='rcx-select__anchor--grow rcx-select__anchor--last'
			autoComplete='off'
		/>
	);
}

export default MultiSelectFilteredAnchor;
