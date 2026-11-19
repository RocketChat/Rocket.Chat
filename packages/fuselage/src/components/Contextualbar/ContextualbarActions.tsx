import { ButtonGroup, type ButtonGroupProps } from '../ButtonGroup';

export type ContextualbarActionsProps = ButtonGroupProps;

/** Groups the `ContextualbarAction`s at the end of the header. */
const ContextualbarActions = (props: ContextualbarActionsProps) => <ButtonGroup {...props} />;

export default ContextualbarActions;
