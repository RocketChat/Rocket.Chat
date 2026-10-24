import { styled } from '@tamagui/web';

import { TableBodyFrame } from './TableFrames';
import { asPublicFrame } from '../../helpers/asPublicFrame';
import { variantClass } from '../../helpers/variantClass';
import type { ElementProps } from '../../types/ElementProps';

export type TableBodyProps = ElementProps<HTMLTableSectionElement>;

const TableBody = styled(TableBodyFrame, {
	variants: {
		rcx: { true: variantClass('rcx-table__body') },
	} as const,

	defaultVariants: { rcx: true },
});

export default asPublicFrame<TableBodyProps>(TableBody);
