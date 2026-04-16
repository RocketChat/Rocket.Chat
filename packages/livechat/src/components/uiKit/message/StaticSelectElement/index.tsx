import type * as uikit from '@rocket.chat/ui-kit';
import type { ComponentChild } from 'preact';
import type { TargetedEvent } from 'preact/compat';
import { memo, useCallback, useMemo } from 'preact/compat';

import styles from './styles.scss';
import { createClassName } from '../../../../helpers/createClassName';
import { SelectInput } from '../../../Form/SelectInput';
import { usePerformAction } from '../Block';

type StaticSelectElementProps = uikit.StaticSelectElement & {
	parser: uikit.SurfaceRenderer<ComponentChild>;
};

const StaticSelectElement = ({
	actionId,
	confirm,
	placeholder,
	options /* , optionGroups */,
	initialOption,
	parser,
}: StaticSelectElementProps) => {
	const [performAction, performingAction] = usePerformAction(actionId);

	const handleChange = useCallback(
		async (event: TargetedEvent<HTMLSelectElement>) => {
			event.preventDefault();

			if (confirm) {
				// TODO
			}

			await performAction({
				value: event.currentTarget?.value,
			});
		},
		[confirm, performAction],
	);

	const selectOptions = useMemo(
		() =>
			options.map((option, i) => ({
				label: parser.renderTextObject(option.text, i),
				value: option.value,
			})),
		[options, parser],
	);

	return (
		<SelectInput
			className={createClassName(styles, 'uikit-static-select')}
			disabled={performingAction}
			options={selectOptions}
			placeholder={placeholder && parser.renderTextObject(placeholder, 0)}
			small
			value={initialOption?.value ?? ''}
			onChange={handleChange}
		/>
	);
};

export default memo(StaticSelectElement);
