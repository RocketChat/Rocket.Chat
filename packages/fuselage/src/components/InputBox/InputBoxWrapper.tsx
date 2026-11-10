import type { LabelHTMLAttributes } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';
import { Label } from '../Label';

export type InputBoxWrapperProps = ElementProps<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>> & {
	invisible?: boolean;
};

const InputBoxWrapper = (props: InputBoxWrapperProps) => <Box animated is={Label} rcx-input-box__wrapper {...props} />;

export default InputBoxWrapper;
