import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type TableFootProps = ElementProps<HTMLTableSectionElement>;

/** Holds the rows at the end of a `Table`, such as totals. */
const TableFoot = (props: TableFootProps) => <Box is='tfoot' rcx-table__foot {...props} />;

export default TableFoot;
