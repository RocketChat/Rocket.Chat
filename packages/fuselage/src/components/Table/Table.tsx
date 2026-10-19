import { Box, type BoxProps } from '../Box';

export type TableProps = BoxProps & {
	striped?: boolean;
	sticky?: boolean;
	fixed?: boolean;
};

const Table = ({ striped, sticky, fixed = false, ...props }: TableProps) => (
	<Box rcx-table__wrapper>
		<Box is='table' rcx-table rcx-table--fixed={fixed} rcx-table--sticky={sticky} rcx-table--striped={striped} {...props} />
	</Box>
);

export default Table;
