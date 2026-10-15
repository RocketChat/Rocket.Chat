import { Button, type ButtonProps } from '../../Button';

export type TableSelectionButtonProps = ButtonProps;

const TableSelectionButton = (props: TableSelectionButtonProps) => <Button small flexShrink={0} {...props} />;

export default TableSelectionButton;
