import { IconButton, type IconButtonProps } from '../Button';

export type ContextualbarActionProps = {
	/** Icon of the button. */
	name: IconButtonProps['icon'];
} & Omit<IconButtonProps, 'name' | 'icon'>;

/** Icon button for an action in the `ContextualbarHeader`. */
const ContextualbarAction = ({ name, ...props }: ContextualbarActionProps) => <IconButton size='small' icon={name} {...props} />;

export default ContextualbarAction;
