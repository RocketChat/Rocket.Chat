import { CheckBox, Box } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';

import OptionLabel from './OptionLabel';
import { useUiKitState } from '../hooks/useUiKitState';
import type { BlockProps } from '../utils/BlockProps';

export type CheckboxElementProps = BlockProps<UiKit.CheckboxElement>;

const CheckboxElement = ({ block, context, surfaceRenderer }: CheckboxElementProps) => {
	const [{ loading, value }, action] = useUiKitState(block, context);
	const { options } = block;

	return (
		<Box>
			{options.map((option: UiKit.Option, index) => {
				const isChecked = value?.includes(option.value);
				const id = `${block.actionId}-${option.value}`;

				return (
					<Box key={option.value} display='flex' alignItems='flex-start' paddingBlock={4}>
						<CheckBox
							id={id}
							autoFocus={block.focus_on_load && index === 0}
							disabled={loading}
							value={option.value}
							checked={isChecked}
							onChange={action}
						/>
						<OptionLabel htmlFor={id} option={option} surfaceRenderer={surfaceRenderer} />
					</Box>
				);
			})}
		</Box>
	);
};

export default CheckboxElement;
