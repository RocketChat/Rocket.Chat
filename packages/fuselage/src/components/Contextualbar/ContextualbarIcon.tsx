import { memo } from 'react';

import { Icon, type IconProps } from '../Icon';

export type ContextualbarIconProps = IconProps;

const ContextualbarIcon = (props: ContextualbarIconProps) => <Icon {...props} paddingInline={2} size='x20' />;

export default memo(ContextualbarIcon);
