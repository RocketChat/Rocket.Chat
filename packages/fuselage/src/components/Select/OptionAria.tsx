import type { Node } from '@react-types/shared';
import { useRef } from 'react';
import { useOption } from 'react-aria';
import type { ListState } from 'react-stately';

import { Option } from '../Option';

type OptionAriaProps = {
	item: Node<unknown>;
	state: ListState<unknown>;
};

function OptionAria({ item, state }: OptionAriaProps) {
	const ref = useRef<HTMLLIElement>(null);
	const { optionProps, isDisabled, isSelected, isFocused } = useOption(
		{
			key: item.key,
		},
		state,
		ref,
	);

	return (
		<Option ref={ref} disabled={isDisabled} selected={isSelected} focus={isFocused} key={item.key} label={item.rendered} {...optionProps}>
			{item.rendered}
		</Option>
	);
}

export default OptionAria;
