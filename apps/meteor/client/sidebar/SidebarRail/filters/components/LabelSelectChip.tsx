import { Box, Chip, Icon } from '@rocket.chat/fuselage';
import type { MouseEventHandler } from 'react';
import { useContext } from 'react';

import { LabelSelectOptionsContext } from './LabelSelectOptionsContext';

type LabelSelectChipProps = {
	value: string;
	label: string;
	onMouseDown: MouseEventHandler;
};

const LabelSelectChip = ({ value, label, onMouseDown }: LabelSelectChipProps) => {
	const meta = useContext(LabelSelectOptionsContext).get(value);

	return (
		<Chip height='x20' marginInlineEnd={4} marginBlock={2} onMouseDown={onMouseDown}>
			<Icon name={meta?.icon ?? 'plus'} color={meta?.color} size='x16' verticalAlign='middle' aria-hidden />
			<Box is='span' margin='none' marginInlineStart={4} verticalAlign='middle'>
				{label}
			</Box>
		</Chip>
	);
};

export default LabelSelectChip;
