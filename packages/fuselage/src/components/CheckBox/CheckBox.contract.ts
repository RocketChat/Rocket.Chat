import type { ReactNode } from 'react';

import type { SelectionContract } from '../../types/Attributes.contract';

export type CheckBoxContract = SelectionContract & {
	indeterminate?: boolean;
	labelChildren?: ReactNode;
};
