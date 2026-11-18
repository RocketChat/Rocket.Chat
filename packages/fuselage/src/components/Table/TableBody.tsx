import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type TableBodyProps = ElementProps<HTMLTableSectionElement>;

/** Holds the rows of data of a `Table`. */
const TableBody = (props: TableBodyProps) => <Box is='tbody' rcx-table__body {...props} />;

export default TableBody;
