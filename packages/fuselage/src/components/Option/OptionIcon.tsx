import { Icon, type IconProps } from '../Icon';
import OptionColumn from './OptionColumn';

export type OptionIconProps = IconProps;

const OptionIcon = (props: OptionIconProps) => (
	<OptionColumn>
		<Icon size='x20' rcx-option__icon {...props} />
	</OptionColumn>
);

export default OptionIcon;
