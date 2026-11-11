import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type TableBodyProps = ElementProps<HTMLTableSectionElement>;

const TableBody = (props: TableBodyProps) => <Box is='tbody' rcx-table__body {...props} />;

export default TableBody;
