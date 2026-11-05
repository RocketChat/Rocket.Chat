import { use, type InputEvent } from 'react';

import { StylingBox } from '../Box';
import { Input } from '../InputBox';
import type { MultiSelectAnchorParams } from './MultiSelectAnchorParams';
import { MultiSelectFilteredContext } from './MultiSelectFilteredContext';

type MultiSelectFilteredAnchorProps = MultiSelectAnchorParams;

function MultiSelectFilteredAnchor({ children: _children, ...props }: MultiSelectFilteredAnchorProps) {
	const { placeholder, filter, setFilter } = use(MultiSelectFilteredContext);

	return (
		<StylingBox flexGrow={1} order={1}>
			<Input
				placeholder={placeholder}
				value={filter}
				onInput={(e: InputEvent<HTMLInputElement>) => setFilter?.(e.currentTarget.value)}
				{...props}
				className='rcx-input-box--undecorated'
				autoComplete='off'
			/>
		</StylingBox>
	);
}

export default MultiSelectFilteredAnchor;
