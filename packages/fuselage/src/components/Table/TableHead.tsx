import type { GetProps } from '@tamagui/web';
import { createContext } from 'react';

import type { TableProps } from './Table';
import { TableHeadFrame } from './TableFrames';
import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export const TableHeadContext = createContext(false);

export type TableHeadProps = TableProps;

const TableHead = (props: TableHeadProps) => {
	const headProps = useTamaguiBoxProps({ 'rcx-table__head': true, ...props });

	return (
		<TableHeadContext.Provider value={true}>
			<TableHeadFrame {...(headProps as GetProps<typeof TableHeadFrame>)} />
		</TableHeadContext.Provider>
	);
};

export default withFuselageProvider(TableHead);
