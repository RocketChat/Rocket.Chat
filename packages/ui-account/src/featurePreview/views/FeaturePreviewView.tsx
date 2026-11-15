import {
	ButtonGroup,
	Button,
	Box,
	ToggleSwitch,
	States,
	StatesIcon,
	StatesTitle,
	Accordion,
	AccordionItem,
	Field,
	FieldGroup,
	FieldLabel,
	FieldRow,
	FieldHint,
	Callout,
	Margins,
} from '@rocket.chat/fuselage';
import { Page, PageHeader, PageScrollableContentWithShadow, PageFooter, useFeaturePreviewEnableQuery } from '@rocket.chat/ui-client';
import type { ChangeEvent } from 'react';
import { Fragment } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { FeaturePreviewPreferencesViewModel } from '../logic/useFeaturePreviewPreferences';

export type FeaturePreviewViewProps = {
	vm: FeaturePreviewPreferencesViewModel;
};

const FeaturePreviewView = ({ vm: { features, save } }: FeaturePreviewViewProps) => {
	const { t } = useTranslation();

	const {
		watch,
		formState: { isDirty },
		setValue,
		handleSubmit,
		reset,
	} = useForm({
		defaultValues: { featuresPreview: features },
	});

	const { featuresPreview } = watch();

	const handleSave = async () => {
		await save(featuresPreview);
		reset({ featuresPreview });
	};

	const handleFeatures = (e: ChangeEvent<HTMLInputElement>) => {
		const updated = featuresPreview.map((item) => (item.name === e.target.name ? { ...item, value: e.target.checked } : item));
		setValue('featuresPreview', updated, { shouldDirty: true });
	};

	const grouppedFeaturesPreview = useFeaturePreviewEnableQuery(featuresPreview);

	return (
		<Page>
			<PageHeader title={t('Feature_preview')} />
			<PageScrollableContentWithShadow>
				<Box maxWidth='x600' width='full' alignSelf='center'>
					{featuresPreview.length === 0 && (
						<States>
							<StatesIcon name='magnifier' />
							<StatesTitle>{t('No_feature_to_preview')}</StatesTitle>
						</States>
					)}
					{featuresPreview.length > 0 && (
						<>
							<Box>
								<Margins block={24}>
									<Box fontScale='p1'>{t('Feature_preview_page_description')}</Box>
									<Callout>{t('Feature_preview_page_callout')}</Callout>
								</Margins>
							</Box>
							<Accordion>
								{grouppedFeaturesPreview?.map(([group, features], index) => (
									<AccordionItem defaultExpanded={index === 0} key={group} title={t(group)}>
										<FieldGroup>
											{features.map((feature) => (
												<Fragment key={feature.name}>
													<Field>
														<FieldRow>
															<FieldLabel htmlFor={feature.name}>{t(feature.i18n)}</FieldLabel>
															<ToggleSwitch
																id={feature.name}
																checked={feature.value}
																name={feature.name}
																onChange={handleFeatures}
																disabled={feature.disabled}
															/>
														</FieldRow>
														{feature.description && <FieldHint marginBlockStart={12}>{t(feature.description)}</FieldHint>}
													</Field>
													{feature.imageUrl && (
														<Box is='img' width='100%' height='auto' marginBlockStart={16} src={feature.imageUrl} alt='' />
													)}
												</Fragment>
											))}
										</FieldGroup>
									</AccordionItem>
								))}
							</Accordion>
						</>
					)}
				</Box>
			</PageScrollableContentWithShadow>
			<PageFooter isDirty={isDirty}>
				<ButtonGroup>
					<Button onClick={() => reset({ featuresPreview: features })}>{t('Cancel')}</Button>
					<Button primary disabled={!isDirty} onClick={handleSubmit(handleSave)}>
						{t('Save_changes')}
					</Button>
				</ButtonGroup>
			</PageFooter>
		</Page>
	);
};

export default FeaturePreviewView;
