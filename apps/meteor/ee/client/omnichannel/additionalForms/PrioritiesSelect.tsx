import type { ILivechatPriority, Serialized } from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
import { Field, Select } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';

type PrioritiesSelectProps = {
	value: string;
	label: string;
	options: Serialized<ILivechatPriority[]>;
	onChange: (value: string) => void;
};

export const PrioritiesSelect = ({ value, label, options, onChange }: PrioritiesSelectProps) => {
	const t = useTranslation();
	const optionsSelect = useMemo<SelectOption[]>(
		() => options?.map(({ dirty, name, i18n, _id }) => [_id, dirty && name ? name : t(i18n as TranslationKey)]),
		[options, t],
	);

	return (
		<Field>
			<Field.Label>{label}</Field.Label>
			<Field.Row>
				<Select value={value} onChange={onChange} options={optionsSelect} />
			</Field.Row>
		</Field>
	);
};

export default PrioritiesSelect;
