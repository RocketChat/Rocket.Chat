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
			className='rcx-input-box--undecorated rcx-select__filter-input rcx-select__filter-input--after-values'
			autoComplete='off'
		/>
	);
}

export default MultiSelectFilteredAnchor;
