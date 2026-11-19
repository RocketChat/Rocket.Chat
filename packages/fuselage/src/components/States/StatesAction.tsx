import { Button, type ButtonProps } from '../Button';

export type StatesActionProps = ButtonProps;

/** A button for the next step the state suggests, `primary` unless another `variant` is set. */
const StatesAction = ({ variant = 'primary', ...props }: StatesActionProps) => <Button {...props} variant={variant} />;

export default StatesAction;
