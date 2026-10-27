import { Button, type ButtonProps } from '../Button';

export type StatesActionProps = ButtonProps;

const StatesAction = ({ primary = true, variant = primary ? 'primary' : undefined, ...props }: StatesActionProps) => (
	<Button {...props} variant={variant} />
);

export default StatesAction;
