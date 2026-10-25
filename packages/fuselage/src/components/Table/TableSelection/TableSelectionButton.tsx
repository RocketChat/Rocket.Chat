import { Button, type ButtonProps } from '../../Button';

export type TableSelectionButtonProps = ButtonProps;

const TableSelectionButton = ({ className, ...props }: TableSelectionButtonProps) => (
	<Button small {...props} className={['rcx-table__selection-button', className].filter(Boolean).join(' ')} />
);

export default TableSelectionButton;
