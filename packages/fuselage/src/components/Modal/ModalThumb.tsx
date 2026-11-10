import { styled, View } from '@tamagui/web';

import { Avatar, type AvatarProps } from '../Avatar';

// Declared where it renders: zero-runtime only erases a `styled()` whose every use is in its own module
const ModalThumbFrame = styled(View, {
	render: 'div',
	display: 'block',
	flexDirection: 'row',
	alignItems: 'normal',
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
});

export type ModalThumbProps = AvatarProps;

const ModalThumb = (props: ModalThumbProps) => (
	<ModalThumbFrame className='rcx-box rcx-box--full'>
		<Avatar size='x28' {...props} />
	</ModalThumbFrame>
);

export default ModalThumb;
