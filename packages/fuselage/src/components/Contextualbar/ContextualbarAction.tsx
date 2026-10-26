import { IconButton, type IconButtonProps } from '../Button';

export type ContextualbarActionProps = {
	name: IconButtonProps['icon'];
} & Omit<IconButtonProps, 'name' | 'icon'>;

const ContextualbarAction = ({ name, ...props }: ContextualbarActionProps) => <IconButton small icon={name} {...props} />;

export default ContextualbarAction;
