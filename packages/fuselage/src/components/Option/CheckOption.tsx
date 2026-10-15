import { memo } from 'react';

import { CheckBox } from '../CheckBox';
import Option, { type OptionProps } from './Option';

export type CheckOptionProps = OptionProps;

const CheckOption = ({ selected, children: label, ...options }: CheckOptionProps) => {
	return (
		<Option label={label as string} selected={selected} {...options}>
			<CheckBox checked={selected} />
		</Option>
	);
};

export default memo(CheckOption);
