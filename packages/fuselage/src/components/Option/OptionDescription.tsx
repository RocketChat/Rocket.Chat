import type { ReactNode } from 'react';

import { ItemDescription } from '../Item';

export type OptionDescriptionProps = {
	children?: ReactNode;
};

const OptionDescription = (props: OptionDescriptionProps) => <ItemDescription inline className='rcx-option__description' {...props} />;

export default OptionDescription;
