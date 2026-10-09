import { Icon, Option } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { memo, useContext } from 'react';

import { LabelSelectOptionsContext } from './LabelSelectOptionsContext';

type LabelSelectOptionProps = Omit<ComponentProps<typeof Option>, 'value'> & { value: string };

const LabelSelectOption = ({ value, ...props }: LabelSelectOptionProps) => {
	const meta = useContext(LabelSelectOptionsContext).get(value);

	return <Option {...props} avatar={<Icon name={meta?.icon ?? 'plus'} color={meta?.color} size='x16' aria-hidden />} />;
};

export default memo(LabelSelectOption);
