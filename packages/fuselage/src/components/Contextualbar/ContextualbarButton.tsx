import { Button, type ButtonProps } from '../Button';

export type ContextualbarButtonProps = ButtonProps;

/** A `Button` for the bar, as in the `ContextualbarFooter`. */
const ContextualbarButton = (props: ContextualbarButtonProps) => <Button {...props} />;

export default ContextualbarButton;
