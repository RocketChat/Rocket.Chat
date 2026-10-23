import { Box } from '../Box';
import type { TableProps } from './Table';

export type TableBodyProps = TableProps;

const TableBody = (props: TableBodyProps) => <Box is='tbody' rcx-table__body {...props} />;

export default TableBody;
