import type { IOutboundProviderTemplate, ILivechatContact, Serialized } from '@rocket.chat/core-typings';
import { Box, FieldGroup, Field, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import { capitalize } from '@rocket.chat/string-helpers';
import type { ComponentProps } from 'react';
import { useMemo } from 'react';

import TemplatePlaceholderInput from './TemplatePlaceholderSelector';
import TemplatePreview from './TemplatePreview';
import type { ComponentType, PlaceholderMetadata, TemplateParameters } from '../definitions/template';
import { formatParameter, processComponentPlaceholders } from '../utils/template';

type TemplateEditorProps = Omit<ComponentProps<typeof Box>, 'onChange'> & {
	parameters: TemplateParameters;
	contact?: Serialized<ILivechatContact>;
	template: IOutboundProviderTemplate;
	onChange: (parameters: TemplateParameters) => void;
};

const TemplateEditor = ({ parameters, template, contact, onChange, ...props }: TemplateEditorProps) => {
	const placeholdersMetadata = useMemo<PlaceholderMetadata[]>(() => {
		return processComponentPlaceholders(template.components);
	}, [template]);

	const handleChange = (componentType: ComponentType, index: number, value: string, format: PlaceholderMetadata['format']) => {
		const parameter = [...(parameters[componentType] || [])];

		parameter[index] = formatParameter(format, value);

		onChange({
			...parameters,
			[componentType]: parameter,
		});
	};

	return (
		<Box {...props}>
			<FieldGroup>
				{placeholdersMetadata.map(({ componentType, format, value, raw, index }) => {
					const parameter = parameters?.[componentType]?.[index];

					return (
						<Field key={`${componentType}.${value}`}>
							<FieldLabel htmlFor={`${componentType}.${value}`}>
								{capitalize(componentType.toLowerCase())} {raw}
							</FieldLabel>
							<FieldRow>
								<TemplatePlaceholderInput
									id={`${componentType}.${value}`}
									type={parameter?.type}
									name={`templateParameters.${componentType}.${index}`}
									contact={contact}
									value={parameter?.value || ''}
									onChange={(val: string) => handleChange(componentType, index, val, format)}
								/>
							</FieldRow>
						</Field>
					);
				})}
			</FieldGroup>

			<TemplatePreview template={template} parameters={parameters} />
		</Box>
	);
};

export default TemplateEditor;
