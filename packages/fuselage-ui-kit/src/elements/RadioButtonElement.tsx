import { Box, RadioButton } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';

import OptionLabel from './OptionLabel';
import { useUiKitState } from '../hooks/useUiKitState';
import type { BlockProps } from '../utils/BlockProps';

export type RadioButtonElementProps = BlockProps<UiKit.RadioButtonElement>;

const RadioButtonElement = ({ block, context, surfaceRenderer }: RadioButtonElementProps) => {
	const [{ loading, value }, action] = useUiKitState(block, context);
	const { options } = block;

	return (
		<Box>
			{options.map((option: UiKit.Option) => {
				const id = `${block.actionId}-${option.value}`;

				return (
					<Box key={option.value} display='flex' alignItems='flex-start' paddingBlock={4}>
						<RadioButton id={id} disabled={loading} checked={value === option.value} value={option.value} onChange={action} />
						<OptionLabel htmlFor={id} option={option} surfaceRenderer={surfaceRenderer} />
					</Box>
				);
			})}
		</Box>
	);
};

export default RadioButtonElement;
