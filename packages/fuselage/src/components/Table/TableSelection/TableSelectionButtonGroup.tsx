import type { ButtonGroupProps } from '../../ButtonGroup';
import { ButtonGroup } from '../../ButtonGroup';

export type TableSelectionButtonGroupProps = ButtonGroupProps;

/** Groups the buttons of a `TableSelection`. */
const TableSelectionButtonGroup = (props: TableSelectionButtonGroupProps) => <ButtonGroup {...props} />;

export default TableSelectionButtonGroup;
