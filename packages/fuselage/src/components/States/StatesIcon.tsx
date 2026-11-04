import { Icon, type IconProps } from '../Icon';

export type StatesIconProps = {
	variation?: 'danger' | 'success' | 'warning' | 'primary';
} & IconProps;

const StatesIcon = ({ variation, className, ...props }: StatesIconProps) => (
	<Icon
		{...props}
		className={['rcx-states__icon', variation && `rcx-states__icon--${variation}`, className].filter(Boolean).join(' ')}
		size='x32'
	/>
);

export default StatesIcon;
