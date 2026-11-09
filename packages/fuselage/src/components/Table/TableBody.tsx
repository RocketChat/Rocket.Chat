import type { ElementProps } from '../../types/ElementProps.js';
import { Box } from '../Box/index.js';

export type TableBodyProps = ElementProps<HTMLTableSectionElement>;

const TableBody = (props: TableBodyProps) => <Box is='tbody' rcx-table__body {...props} />;

export default TableBody;
