import { cx } from '../../helpers/composeClassNames';
import { Icon, type IconProps } from '../Icon';
import { ItemIcon } from '../Item';

export type OptionIconProps = IconProps;

const OptionIcon = ({ className, ...props }: OptionIconProps) => (
	<ItemIcon className='rcx-option__column'>
		<Icon size='x20' {...props} className={cx('rcx-option__icon', className)} />
	</ItemIcon>
);

export default OptionIcon;
