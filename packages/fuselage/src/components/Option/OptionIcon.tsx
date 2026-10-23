import { Icon, type IconProps } from '../Icon';
import { ItemIcon } from '../Item';

export type OptionIconProps = IconProps;

const OptionIcon = ({ className, ...props }: OptionIconProps) => (
	<ItemIcon className='rcx-option__column'>
		<Icon size='x20' {...props} className={['rcx-option__icon', ...(Array.isArray(className) ? className : [className])]} />
	</ItemIcon>
);

export default OptionIcon;
