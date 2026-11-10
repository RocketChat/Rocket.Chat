import type { ReactNode } from 'react';

import { ItemMedia } from '../Item';

export type OptionColumnProps = {
	children?: ReactNode;
};

/**
 * A slot of at least 20px for a status, an emoji or a short label. Empty, it lines up rows with and without icons.
 */
const OptionColumn = (props: OptionColumnProps) => <ItemMedia className='rcx-option__column' {...props} />;

export default OptionColumn;
