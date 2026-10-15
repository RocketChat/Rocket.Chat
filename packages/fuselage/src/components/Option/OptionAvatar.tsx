import type { ReactNode } from 'react';

export type OptionAvatarProps = {
	children?: ReactNode;
};

const OptionAvatar = (props: OptionAvatarProps) => <div className='rcx-option__avatar' {...props} />;

export default OptionAvatar;
