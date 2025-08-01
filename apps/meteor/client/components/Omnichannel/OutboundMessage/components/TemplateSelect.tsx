import type { IOutboundProviderTemplate } from '@rocket.chat/core-typings';
import { Select } from '@rocket.chat/fuselage';
import { useMemo } from 'react';
import type { Key, ComponentProps } from 'react';

type TemplateSelectProps = Omit<ComponentProps<typeof Select>, 'value' | 'onChange' | 'options'> & {
	templates: IOutboundProviderTemplate[];
	value: string;
	onChange(value: Key): void;
};

const TemplateSelect = ({ templates, value, onChange, ...props }: TemplateSelectProps) => {
	const options = useMemo<[string, string][]>(() => {
		return templates.map((template) => [template.id, template.name]);
	}, [templates]);

	return <Select {...props} value={value} options={options} onChange={onChange} />;
};

export default TemplateSelect;
