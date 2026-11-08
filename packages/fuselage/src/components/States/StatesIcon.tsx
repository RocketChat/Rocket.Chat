import { Icon, type IconProps } from '../Icon';

export type StatesIconProps = {
	variation?: 'danger' | 'success' | 'warning' | 'primary';
} & IconProps;

const StatesIcon = ({ variation, className, ...props }: StatesIconProps) => (
	<Icon
		size='x32'
		{...props}
		className={['rcx-states__icon', variation && `rcx-states__icon--${variation}`, className].filter(Boolean).join(' ')}
	/>
);

export default StatesIcon;
