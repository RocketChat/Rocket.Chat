import type { RefObject } from 'react';
import { useRef } from 'react';
import type { AriaListBoxOptions } from 'react-aria';
import { useListBox } from 'react-aria';
import type { ListState } from 'react-stately';

import ListBoxSection from './ListBoxSection';
import OptionAria from './OptionAria';

type ListBoxProps = AriaListBoxOptions<unknown> & {
	listBoxRef?: RefObject<HTMLDivElement | null>;
	state: ListState<unknown>;
};

export function ListBox(props: ListBoxProps) {
	const ref = useRef<HTMLDivElement>(null);
	const { listBoxRef = ref, state } = props;
	const { listBoxProps } = useListBox(props, state, listBoxRef);

	return (
		<div {...listBoxProps} ref={listBoxRef}>
			{[...state.collection].map((item) =>
				item.type === 'section' ? (
					<ListBoxSection key={item.key} section={item} state={state} />
				) : (
					<OptionAria key={item.key} item={item} state={state} />
				),
			)}
		</div>
	);
}
