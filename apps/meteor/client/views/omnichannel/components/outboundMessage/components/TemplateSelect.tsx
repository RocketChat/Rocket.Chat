import type { IOutboundProviderTemplate } from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
import { Item, ItemContent, ItemDescription, ItemTitle, SelectFiltered } from '@rocket.chat/fuselage';
import { useLanguages } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import type { Key, ComponentProps } from 'react';

export type TemplateSelectProps = Omit<ComponentProps<typeof SelectFiltered>, 'value' | 'onChange' | 'options'> & {
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
			renderItem={({ label, value: templateId, selected, focus, disabled, ...props }) => {
				const { language: templateLanguage = '' } = templateMap.get(templateId) || {};
				const normalizedTemplateLanguage = templateLanguage.replace(/_/g, '-').replace(/en-US/g, 'en');
				const language = languages.find((lang) => lang.key === normalizedTemplateLanguage);

				return (
					<Item
						{...props}
						is='li'
						inset='md'
						selected={selected}
						focused={focus}
						disabled={disabled}
						aria-selected={selected}
						aria-disabled={disabled || undefined}
					>
						<ItemContent>
							<ItemTitle>{label}</ItemTitle>
							{language ? <ItemDescription>{language.name}</ItemDescription> : null}
						</ItemContent>
					</Item>
				);
			}}
		/>
	);
};

export default TemplateSelect;
