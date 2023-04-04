import { memo, useCallback, useMemo } from 'preact/compat';

import { SelectInput } from '../../../Form/SelectInput';
import { createClassName } from '../../../helpers';
import { usePerformAction } from '../Block';
import styles from './styles.scss';

const StaticSelectElement = ({ actionId, confirm, placeholder, options /* , optionGroups */, initialOption, parser }) => {
	const [performAction, performingAction] = usePerformAction(actionId);

	const handleChange = useCallback(
		async (event) => {
			event.preventDefault();

			if (confirm) {
				// TODO
			}

			await performAction({
				value: event.target.value,
			});
		},
		[confirm, performAction],
	);

	const selectOptions = useMemo(
		() =>
			options.map((option) => ({
				label: parser.text(option.text),
				value: option.value,
			})),
		[options, parser],
	);

	return (
		<SelectInput
			className={createClassName(styles, 'uikit-static-select')}
			disabled={performingAction}
			options={selectOptions}
			placeholder={placeholder && parser.text(placeholder)}
			small
			value={(initialOption && initialOption.value) || ''}
			onChange={handleChange}
		/>
	);
};

export default memo(StaticSelectElement);
