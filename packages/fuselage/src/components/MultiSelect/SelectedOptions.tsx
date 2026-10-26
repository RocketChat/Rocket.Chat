import type { MouseEvent, ReactNode } from 'react';
import { memo } from 'react';

import { Chip } from '../Chip';

type SelectedOptionsProps = {
	children: ReactNode;
	tabIndex: number;
	key: string;
	onClick: (e: MouseEvent) => void;
};

export const SelectedOptions = memo(function SelectedOptions(props: SelectedOptionsProps) {
	return <Chip {...props} />;
});
