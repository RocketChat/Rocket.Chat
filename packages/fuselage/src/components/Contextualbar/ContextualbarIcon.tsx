import { memo } from 'react';

import { Icon, type IconProps } from '../Icon';

export type ContextualbarIconProps = IconProps;

const ContextualbarIcon = ({ className, ...props }: ContextualbarIconProps) => (
	<Icon {...props} className={['rcx-contextualbar__icon', ...(Array.isArray(className) ? className : [className])]} size='x20' />
);

export default memo(ContextualbarIcon);
