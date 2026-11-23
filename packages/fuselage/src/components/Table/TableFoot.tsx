import type { ElementProps } from '../../types/ElementProps.js';
import { Box } from '../Box/index.js';

export type TableFootProps = ElementProps<HTMLTableSectionElement>;

const TableFoot = (props: TableFootProps) => <Box is='tfoot' rcx-table__foot {...props} />;

export default TableFoot;
