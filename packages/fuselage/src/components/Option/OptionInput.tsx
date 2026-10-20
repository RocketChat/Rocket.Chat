import type { ReactNode } from 'react';

import { ItemActions } from '../Item';

export type OptionInputProps = {
	children?: ReactNode;
};

const OptionInput = (props: OptionInputProps) => <ItemActions className='rcx-option__input' {...props} />;

export default OptionInput;
