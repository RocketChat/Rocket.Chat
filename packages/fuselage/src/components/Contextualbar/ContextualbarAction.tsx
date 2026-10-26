import { memo } from 'react';

import { IconButton, type IconButtonProps } from '../Button';

export type ContextualbarActionProps = {
	name: IconButtonProps['icon'];
} & Omit<IconButtonProps, 'name' | 'icon'>;

const ContextualbarAction = ({ name, ...props }: ContextualbarActionProps) => <IconButton size='small' icon={name} {...props} />;

export default memo(ContextualbarAction);
