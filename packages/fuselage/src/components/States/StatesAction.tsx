import { Button, type ButtonProps } from '../Button';

export type StatesActionProps = ButtonProps;

const StatesAction = ({ primary = true, ...props }: StatesActionProps) => <Button {...props} primary={primary} />;

export default StatesAction;
