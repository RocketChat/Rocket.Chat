import { Button, type ButtonProps } from '../Button';

export type StatesActionProps = ButtonProps;

const StatesAction = ({ variant = 'primary', ...props }: StatesActionProps) => <Button {...props} variant={variant} />;

export default StatesAction;
