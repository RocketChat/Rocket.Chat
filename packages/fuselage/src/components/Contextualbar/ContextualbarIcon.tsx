import { Icon, type IconProps } from '../Icon';

export type ContextualbarIconProps = IconProps;

/** An icon sized for the bar's header. */
const ContextualbarIcon = (props: ContextualbarIconProps) => <Icon size='x20' {...props} />;

export default ContextualbarIcon;
