import type { ReactNode } from 'react';

import type { SelectionContract } from '../../types/Attributes.contract';

export type ToggleSwitchContract = SelectionContract & {
	labelChildren?: ReactNode;
};
