import { memo } from 'react';

import { IconButton, type IconButtonProps } from '../Button';

export type ContextualbarActionProps = {
	name: IconButtonProps['icon'];
} & Omit<IconButtonProps, 'name' | 'icon'>;

const ContextualbarAction = ({ name, ...props }: ContextualbarActionProps) => <IconButton {...props} small icon={name} />;

export default memo(ContextualbarAction);
