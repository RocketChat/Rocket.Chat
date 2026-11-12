import type { LabelHTMLAttributes } from 'react';

import type { ElementProps } from '../../types/ElementProps.js';
import { Box } from '../Box/index.js';
import { Label } from '../Label/index.js';

export type InputBoxWrapperProps = ElementProps<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>> & {
	invisible?: boolean;
};

const InputBoxWrapper = (props: InputBoxWrapperProps) => <Box animated is={Label} rcx-input-box__wrapper {...props} />;

export default InputBoxWrapper;
