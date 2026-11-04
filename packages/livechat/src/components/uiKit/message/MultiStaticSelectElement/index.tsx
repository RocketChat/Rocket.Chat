import type * as uikit from '@rocket.chat/ui-kit';
import type { ComponentChild } from 'preact';
import type { TargetedEvent } from 'preact/compat';
import { memo, useCallback } from 'preact/compat';

import { usePerformAction } from '../Block';

export type MultiStaticSelectElementProps = uikit.MultiStaticSelectElement & {
	parser: uikit.SurfaceRenderer<ComponentChild>;
};

const textOf = (text: uikit.TextObject) => text.text;

const MultiStaticSelectElement = ({ actionId, options, initialValue, initialOption }: MultiStaticSelectElementProps) => {
	const [performAction, performingAction] = usePerformAction(actionId);
	const initial = initialValue ?? initialOption?.map(({ value }) => value) ?? [];

	const handleChange = useCallback(
		async ({ currentTarget }: TargetedEvent<HTMLSelectElement>) => {
			const value = Array.from(currentTarget.selectedOptions, (option) => option.value);

			await performAction({ value });
		},
		[performAction],
	);

	return (
		<select multiple disabled={performingAction} onChange={handleChange}>
			{options.map((option) => (
				<option key={option.value} value={option.value} selected={initial.includes(option.value)}>
					{textOf(option.text)}
				</option>
			))}
		</select>
	);
};

export default memo(MultiStaticSelectElement);
