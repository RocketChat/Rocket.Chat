import type { IOutboundProviderTemplate } from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
import { Option, OptionDescription, SelectFiltered } from '@rocket.chat/fuselage';
import { useLanguages } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import type { Key, ComponentProps } from 'react';

type TemplateSelectProps = Omit<ComponentProps<typeof SelectFiltered>, 'value' | 'onChange' | 'options'> & {
	templates: IOutboundProviderTemplate[];
	value: string;
	onChange(value: Key): void;
};

const TemplateSelect = ({ templates, value, onChange, ...props }: TemplateSelectProps) => {
	const languages = useLanguages();

	const [options, templateMap] = useMemo(() => {
		const templateMap = new Map<string, IOutboundProviderTemplate>();
		const templateOptions: SelectOption[] = [];

		for (const template of templates) {
			templateMap.set(template.id, template);
			templateOptions.push([template.id, template.name]);
		}

		return [templateOptions, templateMap];
	}, [templates]);

	return (
		<SelectFiltered
			{...props}
			value={value}
			options={options}
			onChange={onChange}
			renderItem={({ label, value: templateId, ...props }) => {
				const { language: templateLanguage = '' } = templateMap.get(templateId) || {};
				const normalizedTemplateLanguage = templateLanguage.replace(/_/g, '-').replace(/en-US/g, 'en');
				const language = languages.find((lang) => lang.key === normalizedTemplateLanguage);

				return (
					<Option {...props} label={label}>
						{language ? <OptionDescription>{language.name}</OptionDescription> : null}
					</Option>
				);
			}}
		/>
	);
};

export default TemplateSelect;
