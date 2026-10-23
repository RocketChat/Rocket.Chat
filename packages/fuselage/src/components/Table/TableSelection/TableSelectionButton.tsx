import { Button, type ButtonProps } from '../../Button';

export type TableSelectionButtonProps = ButtonProps;

const TableSelectionButton = ({ className, ...props }: TableSelectionButtonProps) => (
	<Button small {...props} className={['rcx-table__selection-button', ...(Array.isArray(className) ? className : [className])]} />
);

export default TableSelectionButton;
