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
import { usePreferenceFeaturePreviewList } from '@rocket.chat/ui-client';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useToastMessageDispatch, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import type { ChangeEvent } from 'react';
import { useEffect, Fragment } from 'react';
import { useForm } from 'react-hook-form';

import { Page, PageHeader, PageScrollableContentWithShadow, PageFooter } from '../../../components/Page';
import { useFeaturePreviewEnableQuery } from '../../../hooks/useFeaturePreviewEnableQuery';

const AccountFeaturePreviewPage = () => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const { features, unseenFeatures } = usePreferenceFeaturePreviewList();

	const setUserPreferences = useEndpoint('POST', '/v1/users.setPreferences');

	useEffect(() => {
		if (unseenFeatures) {
			const featuresPreview = features.map((feature) => ({
				name: feature.name,
				value: feature.value,
			}));

			void setUserPreferences({ data: { featuresPreview } });
		}
	}, [setUserPreferences, features, unseenFeatures]);

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
		const featuresToBeSaved = featuresPreview.map((feature) => ({ name: feature.name, value: feature.value }));
		try {
			await setUserPreferences({ data: { featuresPreview: featuresToBeSaved } });
			dispatchToastMessage({ type: 'success', message: t('Preferences_saved') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			reset({ featuresPreview });
		}
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
				<Box maxWidth='x600' w='full' alignSelf='center'>
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
									<AccordionItem defaultExpanded={index === 0} key={group} title={t(group as TranslationKey)}>
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
														{feature.description && <FieldHint mbs={12}>{t(feature.description)}</FieldHint>}
													</Field>
													{feature.imageUrl && <Box is='img' width='100%' height='auto' mbs={16} src={feature.imageUrl} alt='' />}
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

export default AccountFeaturePreviewPage;
