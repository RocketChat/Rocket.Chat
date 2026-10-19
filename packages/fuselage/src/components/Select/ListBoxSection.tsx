import type { Node } from '@react-types/shared';
import { useListBoxSection } from 'react-aria';
import type { ListState } from 'react-stately';

import { ItemGroup, ItemGroupHeader, ItemGroupTitle } from '../Item';
import OptionAria from './OptionAria';

type ListBoxSectionProps = {
	section: Node<unknown>;
	state: ListState<unknown>;
};

function ListBoxSection({ section, state }: ListBoxSectionProps) {
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

export default ListBoxSection;
