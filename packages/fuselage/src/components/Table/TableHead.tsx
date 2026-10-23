import type { GetProps } from '@tamagui/web';
import { createContext } from 'react';

import { TableHeadFrame } from './TableFrames';
import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import type { ElementProps } from '../../types/ElementProps';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export const TableHeadContext = createContext(false);

export type TableHeadProps = ElementProps<HTMLTableSectionElement>;

const TableHead = (props: TableHeadProps) => {
	const headProps = useTamaguiBoxProps({ 'rcx-table__head': true, ...props });

	return (
		<TableHeadContext.Provider value={true}>
			<TableHeadFrame {...(headProps as GetProps<typeof TableHeadFrame>)} />
		</TableHeadContext.Provider>
	);
};

export default withFuselageProvider(TableHead, { takesBoxTransforms: true });
