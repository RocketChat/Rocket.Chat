import { Box } from '../Box';
import type { TableProps } from './Table';

export type TableFootProps = TableProps;

const TableFoot = (props: TableFootProps) => <Box is='tfoot' rcx-table__foot {...props} />;

export default TableFoot;
