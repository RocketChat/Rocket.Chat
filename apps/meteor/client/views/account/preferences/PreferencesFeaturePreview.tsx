import { Accordion, Field, FieldGroup, ToggleSwitch } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useUserPreference, useTranslation } from '@rocket.chat/ui-contexts';
import type { ChangeEvent, ReactElement } from 'react';
import React from 'react';

import { useForm } from '../../../hooks/useForm';
import type { FormSectionProps } from './AccountPreferencesPage';

type FeaturePreviewProps = { name: string; value: boolean; i18n: TranslationKey };

const PreferencesFeaturePreview = ({ onChange, commitRef, ...props }: FormSectionProps): ReactElement => {
	const t = useTranslation();

	const userFeaturesPreview = useUserPreference<FeaturePreviewProps[]>('featuresPreview');

	const defaultFeaturesPreview = [
		{
			name: 'newNavbar',
			value: false,
			i18n: t('New_navbar'),
		},
		{
			name: 'contextualbarResizable',
			value: false,
			i18n: t('Contextualbar_resizable'),
		},
	];

	const { values, handlers, commit } = useForm(
		{
			featuresPreview: userFeaturesPreview || defaultFeaturesPreview,
		},
		onChange,
	);

	const { featuresPreview } = values as {
		featuresPreview: FeaturePreviewProps[];
	};

	const { handleFeaturesPreview } = handlers;

	commitRef.current.featurePreview = commit;

	const handleFeatures = (e: ChangeEvent<HTMLInputElement>) => {
		const updated = featuresPreview.map((item) => (item.name === e.target.name ? { ...item, value: e.target.checked } : item));
		handleFeaturesPreview(updated);
	};

	return (
		<Accordion.Item title={t('Feature_preview')} {...props}>
			<FieldGroup>
				{featuresPreview.length > 0 &&
					featuresPreview?.map((feature) => (
						<Field key={feature.name} display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
							<Field.Label>{feature.i18n}</Field.Label>
							<Field.Row>
								<ToggleSwitch checked={feature.value} name={feature.name} onChange={handleFeatures} />
							</Field.Row>
						</Field>
					))}
			</FieldGroup>
		</Accordion.Item>
	);
};

export default PreferencesFeaturePreview;
