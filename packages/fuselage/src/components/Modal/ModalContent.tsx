import { styled, Text, View } from '@tamagui/web';
import type { ReactNode } from 'react';

import { ariaAndDataAttributes } from '../../helpers/ariaAndDataAttributes';
import type { PartAttributes } from '../../types/ElementAttributes';

// Declared where they render: zero-runtime only erases a `styled()` whose every use is in its own module
const ModalContentFrame = styled(View, {
	render: 'div',
	display: 'block',
	flexDirection: 'row',
	alignItems: 'normal',
	position: 'relative',
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
	overflowY: 'auto',
});

const ModalContentWrapperFrame = styled(Text, {
	render: 'div',
	display: 'block',
	flexDirection: 'row',
	alignItems: 'normal',
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
	whiteSpace: 'inherit',
	wordWrap: 'inherit',
});

export type ModalContentProps = {
	/** Stretches the content to the modal's height and closes the modal itself, for content that brings its own footer. */
	fill?: boolean;
	children?: ReactNode;
} & PartAttributes<HTMLDivElement>;

const ModalContent = (props: ModalContentProps) => (
	<ModalContentFrame className='rcx-box rcx-box--full rcx-modal__content'>
		<ModalContentWrapperFrame
			render={<div {...ariaAndDataAttributes(props)} ref={props.ref} id={props.id} title={props.title} />}
			className={['rcx-box rcx-box--full', props.fill && 'rcx-modal__content-wrapper--fill', 'rcx-modal__content-wrapper', props.className]
				.filter(Boolean)
				.join(' ')}
		>
			{props.children}
		</ModalContentWrapperFrame>
	</ModalContentFrame>
);

export default ModalContent;
