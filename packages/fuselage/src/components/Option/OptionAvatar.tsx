import type { ReactNode } from 'react';

import { ItemMedia } from '../Item';

export type OptionAvatarProps = {
	children?: ReactNode;
};

const OptionAvatar = (props: OptionAvatarProps) => <ItemMedia className='rcx-option__avatar' {...props} />;

export default OptionAvatar;
