import type { Node } from '@react-types/shared';
import type { RefObject } from 'react';
import { useRef } from 'react';
import type { AriaListBoxOptions } from 'react-aria';
import { useListBox, useListBoxSection, useOption } from 'react-aria';
import type { ListState } from 'react-stately';

import { ItemGroup, ItemGroupHeader, ItemGroupTitle } from '../Item';
import { Option } from '../Option';

type ListBoxProps = AriaListBoxOptions<unknown> & {
	listBoxRef?: RefObject<HTMLDivElement | null>;
	state: ListState<unknown>;
};

type SectionProps = {
	section: Node<unknown>;
	state: ListState<unknown>;
};

type OptionProps = {
	item: Node<unknown>;
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

// eslint-disable-next-line react/no-multi-comp
function ListBoxSection({ section, state }: SectionProps) {
	const { itemProps, headingProps, groupProps } = useListBoxSection({
		'heading': section.rendered,
		'aria-label': section['aria-label'],
	});

	return (
		<li {...itemProps}>
			{section.rendered && (
				<ItemGroupHeader inset='md'>
					<ItemGroupTitle {...headingProps}>{section.rendered}</ItemGroupTitle>
				</ItemGroupHeader>
			)}
			<ItemGroup is='ul' {...groupProps}>
				{[...section.childNodes].map((node) => (
					<OptionAria key={node.key} item={node} state={state} />
				))}
			</ItemGroup>
		</li>
	);
}

// eslint-disable-next-line react/no-multi-comp
function OptionAria({ item, state }: OptionProps) {
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
