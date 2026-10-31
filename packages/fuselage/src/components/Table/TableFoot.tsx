import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type TableFootProps = ElementProps<HTMLTableSectionElement>;

const TableFoot = (props: TableFootProps) => <Box is='tfoot' rcx-table__foot {...props} />;

export default TableFoot;
