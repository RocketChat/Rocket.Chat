import type { ReactNode } from 'react';

import type { SelectionContract } from '../../types/Attributes.contract';

export type RadioButtonContract = SelectionContract & {
	labelChildren?: ReactNode;
};
