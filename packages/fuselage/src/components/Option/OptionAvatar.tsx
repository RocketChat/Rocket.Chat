import { cx } from '../../helpers/composeClassNames';
import { ItemMedia, type ItemMediaProps } from '../Item';

export type OptionAvatarProps = Omit<ItemMediaProps, 'variant'>;

const OptionAvatar = ({ className, ...props }: OptionAvatarProps) => (
	<ItemMedia {...props} className={cx('rcx-option__avatar', className)} />
);

export default OptionAvatar;
