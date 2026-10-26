import { prependClassName } from '../../../helpers/prependClassName';
import { Icon, type IconProps } from '../../Icon';

export type ThreadMessageIconProps = IconProps;

const ThreadMessageIcon = ({ className, ...props }: IconProps) => (
	<Icon className={prependClassName(className, 'rcx-message-thread__icon')} size='x16' color='info' {...props} />
);

export default ThreadMessageIcon;
