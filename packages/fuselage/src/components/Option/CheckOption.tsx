import { memo } from 'react';

import { CheckBox } from '../CheckBox';
import Option, { type OptionProps } from './Option';

export type CheckOptionProps = OptionProps;

/**
 * An `Option` with a checkbox. Its selection is announced through `aria-selected`, so the checkbox is hidden from assistive technology.
 */
const CheckOption = ({ selected, children: label, ...options }: CheckOptionProps) => {
	return (
		<Option label={label as string} selected={selected} {...options}>
			<CheckBox checked={!!selected} readOnly tabIndex={-1} aria-hidden inert />
		</Option>
	);
};

export default memo(CheckOption);
