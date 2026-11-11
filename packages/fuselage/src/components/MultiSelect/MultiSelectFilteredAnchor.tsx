import { use, type InputEvent } from 'react';

import { FlexItem } from '../Flex';
import { Input } from '../InputBox';
import type { MultiSelectAnchorParams } from './MultiSelectAnchorParams';
import { MultiSelectFilteredContext } from './MultiSelectFilteredContext';

type MultiSelectFilteredAnchorProps = MultiSelectAnchorParams;

function MultiSelectFilteredAnchor({ children: _children, ...props }: MultiSelectFilteredAnchorProps) {
	const { placeholder, filter, setFilter } = use(MultiSelectFilteredContext);

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
