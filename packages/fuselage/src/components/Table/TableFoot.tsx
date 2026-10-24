import { styled } from '@tamagui/web';

import { TableFootFrame } from './TableFrames';
import { asPublicFrame } from '../../helpers/asPublicFrame';
import { variantClass } from '../../helpers/variantClass';
import type { ElementProps } from '../../types/ElementProps';

export type TableFootProps = ElementProps<HTMLTableSectionElement>;

const TableFoot = styled(TableFootFrame, {
	variants: {
		rcx: { true: variantClass('rcx-table__foot') },
	} as const,

	defaultVariants: { rcx: true },
});

export default asPublicFrame<TableFootProps>(TableFoot);
