import type { IOutboundProviderTemplate, ILivechatContact, Serialized } from '@rocket.chat/core-typings';
import { Box, FieldGroup, Field, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import { capitalize } from '@rocket.chat/string-helpers';
import type { ComponentProps } from 'react';
import { useMemo } from 'react';

import TemplatePlaceholderInput from './TemplatePlaceholderSelector';
import TemplatePreview from './TemplatePreview';
import type { PlaceholderMetadata, TemplateParameters } from '../definitions/template';
import { processTemplatePlaceholders } from '../utils/template';

type TemplateEditorProps = Omit<ComponentProps<typeof Box>, 'onChange'> & {
	parameters: TemplateParameters;
	contact?: Serialized<ILivechatContact>;
	template: IOutboundProviderTemplate;
	onChange: (parameters: TemplateParameters) => void;
};

const TemplateEditor = ({ parameters, template, contact, onChange, ...props }: TemplateEditorProps) => {
	const placeholdersMetadata = useMemo<PlaceholderMetadata[]>(() => {
		return processTemplatePlaceholders(template);
	}, [template]);

	const handleChange = (componentType: keyof TemplateParameters, index: number, value: string) => {
		const params = parameters?.[componentType] || [];
		params[index] = value;

		onChange({
			...parameters,
			[componentType]: params,
		});
	};

	return (
		<Box {...props}>
			<FieldGroup>
				{placeholdersMetadata.map(({ componentType, format, value, raw, index }) => (
					<Field key={`${componentType}.${value}`}>
						<FieldLabel htmlFor={`${componentType}.${value}`}>
							{capitalize(componentType.toLowerCase())} {raw}
						</FieldLabel>
						<FieldRow>
							<TemplatePlaceholderInput
								id={`${componentType}.${value}`}
								format={format}
								name={`templateParameters.${componentType}.${index}`}
								contact={contact}
								value={parameters?.[componentType]?.[index] ?? ''}
								onChange={(val: string) => handleChange(componentType, index, val)}
							/>
						</FieldRow>
					</Field>
				))}
			</FieldGroup>

			<TemplatePreview template={template} parameters={parameters} />
		</Box>
	);
};

export default TemplateEditor;
