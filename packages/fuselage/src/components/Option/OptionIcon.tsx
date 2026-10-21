import { Icon, type IconProps } from '../Icon';
import { ItemIcon } from '../Item';

export type OptionIconProps = IconProps;

const OptionIcon = (props: OptionIconProps) => (
	<ItemIcon className='rcx-option__column'>
		<Icon size='x20' rcx-option__icon {...props} />
	</ItemIcon>
);

export default OptionIcon;
