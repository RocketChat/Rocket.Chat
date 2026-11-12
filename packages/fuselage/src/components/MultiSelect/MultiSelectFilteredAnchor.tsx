import { useContext, type InputEvent } from 'react';

import type { MultiSelectAnchorParams } from './MultiSelectAnchorParams.js';
import { MultiSelectFilteredContext } from './MultiSelectFilteredContext.js';
import { FlexItem } from '../Flex/index.js';
import { Input } from '../InputBox/index.js';

type MultiSelectFilteredAnchorProps = MultiSelectAnchorParams;

function MultiSelectFilteredAnchor({ children: _children, ...props }: MultiSelectFilteredAnchorProps) {
	const { placeholder, filter, setFilter } = useContext(MultiSelectFilteredContext);

	return (
		<FlexItem grow={1} order={1}>
			<Input
				placeholder={placeholder}
				value={filter}
				onInput={(e: InputEvent<HTMLInputElement>) => setFilter?.(e.currentTarget.value)}
				{...props}
				className='rcx-input-box--undecorated'
				autoComplete='off'
			/>
		</FlexItem>
	);
}

export default MultiSelectFilteredAnchor;
