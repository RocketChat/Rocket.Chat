import { cx } from '../../../helpers/composeClassNames';
import { Icon, type IconProps } from '../../Icon';

export type ThreadMessageIconProps = IconProps;

const ThreadMessageIcon = ({ className, ...props }: IconProps) => (
	<Icon size='x16' {...props} className={cx('rcx-box rcx-box--full rcx-message-thread__icon', className)} />
);

export default ThreadMessageIcon;
