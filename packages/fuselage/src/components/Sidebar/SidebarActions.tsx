import type { ButtonGroupProps } from '../ButtonGroup';
import { ButtonGroup } from '../ButtonGroup';

export type SidebarActionsProps = ButtonGroupProps;

function SidebarActions(props: SidebarActionsProps) {
	return <ButtonGroup {...props} />;
}

export default SidebarActions;
