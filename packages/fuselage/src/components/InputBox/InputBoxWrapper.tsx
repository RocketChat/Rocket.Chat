import type { LabelHTMLAttributes } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';
import { LabelContext } from '../Label/LabelBase';

export type InputBoxWrapperProps = ElementProps<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>> & {
	invisible?: boolean;
};

const InputBoxWrapper = (props: InputBoxWrapperProps) => (
	<LabelContext.Provider value={true}>
		<Box animated is='label' rcx-label rcx-input-box__wrapper {...props} />
	</LabelContext.Provider>
);

export default InputBoxWrapper;
