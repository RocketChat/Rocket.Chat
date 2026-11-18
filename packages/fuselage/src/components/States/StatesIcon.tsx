import { Icon, type IconProps } from '../Icon';

export type StatesIconProps = {
	/** Colors the icon by the kind of state; without it, the icon is neutral. */
	variation?: 'danger' | 'success' | 'warning' | 'primary';
} & IconProps;

/** Icon in a round frame at the top of the state, reflecting its context. */
const StatesIcon = ({ variation, className, ...props }: StatesIconProps) => (
	<Icon
		size='x32'
		{...props}
		className={['rcx-states__icon', variation && `rcx-states__icon--${variation}`, className].filter(Boolean).join(' ')}
	/>
);

export default StatesIcon;
