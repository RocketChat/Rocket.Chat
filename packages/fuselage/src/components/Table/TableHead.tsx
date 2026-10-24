import type { GetProps } from '@tamagui/web';
import { createContext } from 'react';

import { TableHeadFrame } from './TableFrames';
import type { ElementProps } from '../../types/ElementProps';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export const TableHeadContext = createContext(false);

export type TableHeadProps = ElementProps<HTMLTableSectionElement>;

const TableHead = ({ className, ...props }: TableHeadProps) => {
	return (
		<TableHeadContext.Provider value={true}>
			<TableHeadFrame
				className={['rcx-table__head', className].filter(Boolean).join(' ')}
				{...(props as GetProps<typeof TableHeadFrame>)}
			/>
		</TableHeadContext.Provider>
	);
};

export default withFuselageProvider(TableHead);
