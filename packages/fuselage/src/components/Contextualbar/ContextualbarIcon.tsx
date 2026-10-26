import { memo } from 'react';

import { Icon, type IconProps } from '../Icon';

export type ContextualbarIconProps = IconProps;

const ContextualbarIcon = (props: ContextualbarIconProps) => <Icon size='x20' {...props} />;

export default memo(ContextualbarIcon);
