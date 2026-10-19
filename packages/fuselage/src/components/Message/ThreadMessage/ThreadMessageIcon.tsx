import { Icon, type IconProps } from '../../Icon';

export type ThreadMessageIconProps = IconProps;

const ThreadMessageIcon = ({ ...props }: IconProps) => <Icon className='rcx-message-thread__icon' size='x16' {...props} />;

export default ThreadMessageIcon;
