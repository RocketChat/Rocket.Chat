import type { IOutboundProviderTemplate, ILivechatContact, Serialized } from '@rocket.chat/core-typings';
import { Box, FieldGroup, Field, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { useMemo } from 'react';

import TemplatePlaceholderInput from './TemplatePlaceholderSelector';
import TemplatePreview from './TemplatePreview';
import type { TemplateParameterMetadata, TemplateParameters } from '../definitions/template';
import { extractParameterMetadata, updateTemplateParameters } from '../utils/template';

type TemplateEditorProps = Omit<ComponentProps<typeof Box>, 'onChange'> & {
	parameters: TemplateParameters;
	contact?: Serialized<ILivechatContact>;
	template: IOutboundProviderTemplate;
	onChange: (parameters: TemplateParameters) => void;
};

const TemplateEditor = ({ parameters, template, contact, onChange, ...props }: TemplateEditorProps) => {
	const { components } = template;

	const parameterMetadata = useMemo(() => extractParameterMetadata(components), [components]);

	const handleChange = (value: string, metadata: TemplateParameterMetadata) => {
		const updatedParameters = updateTemplateParameters(parameters, metadata, value);

		onChange(updatedParameters);
	};

	return (
		<Box {...props}>
			<FieldGroup>
				{parameterMetadata.map((parameter) => {
					const { index, id, type, name, componentType } = parameter;
					const value = parameters[componentType]?.[index]?.value;

					return (
						<Field key={id}>
							<FieldLabel htmlFor={id}>{name}</FieldLabel>
							<FieldRow>
								<TemplatePlaceholderInput
									id={id}
									type={type}
									name={`templateParameters.${componentType}.${index}`}
									contact={contact}
									value={value || ''}
									onChange={(value: string) => handleChange(value, parameter)}
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
