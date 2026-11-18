import { Button, type ButtonProps } from '../../Button';

export type TableSelectionButtonProps = ButtonProps;

/** A small button for an action on the rows counted by a `TableSelection`. */
const TableSelectionButton = ({ className, ...props }: TableSelectionButtonProps) => (
	<Button size='small' {...props} className={['rcx-table__selection-button', className].filter(Boolean).join(' ')} />
);

export default TableSelectionButton;
