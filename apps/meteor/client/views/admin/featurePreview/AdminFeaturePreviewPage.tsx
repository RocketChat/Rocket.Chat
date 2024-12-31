import {
	ButtonGroup,
	Button,
	Box,
	ToggleSwitch,
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
import { useDefaultSettingFeaturePreviewList } from '@rocket.chat/ui-client';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useToastMessageDispatch, useTranslation, useSettingsDispatch } from '@rocket.chat/ui-contexts';
import type { ChangeEvent } from 'react';
import { Fragment } from 'react';
import { useForm } from 'react-hook-form';

import { Page, PageHeader, PageScrollableContentWithShadow, PageFooter } from '../../../components/Page';
import { useFeaturePreviewEnableQuery } from '../../../hooks/useFeaturePreviewEnableQuery';
import { useEditableSetting } from '../EditableSettingsContext';
import Setting from '../settings/Setting';
import SettingsGroupPageSkeleton from '../settings/SettingsGroupPage/SettingsGroupPageSkeleton';

const AdminFeaturePreviewPage = () => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const allowFeaturePreviewSetting = useEditableSetting('Accounts_AllowFeaturePreview');
	const { features } = useDefaultSettingFeaturePreviewList();

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
	const dispatch = useSettingsDispatch();

	const handleSave = async () => {
		try {
			const featuresToBeSaved = featuresPreview.map((feature) => ({ name: feature.name, value: feature.value }));

			await dispatch([
				{ _id: allowFeaturePreviewSetting!._id, value: allowFeaturePreviewSetting!.value },
				{ _id: 'Accounts_Default_User_Preferences_featuresPreview', value: JSON.stringify(featuresToBeSaved) },
			]);
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

	if (!allowFeaturePreviewSetting) {
		// TODO: Implement FeaturePreviewSkeleton component
		return <SettingsGroupPageSkeleton />;
	}

	return (
		<Page>
			<PageHeader title={t('Feature_preview')} />
			<PageScrollableContentWithShadow>
				<Box maxWidth='x600' w='full' alignSelf='center'>
					<Box>
						<Margins block={24}>
							<Box fontScale='p1'>{t('Feature_preview_admin_page_description')}</Box>
							<Callout>{t('Feature_preview_page_callout')}</Callout>
							<Callout>{t('Feature_preview_admin_page_callout')}</Callout>
							<Setting settingId='Accounts_AllowFeaturePreview' sectionChanged={allowFeaturePreviewSetting.changed} />
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
														disabled={feature.disabled || !allowFeaturePreviewSetting.value}
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
				</Box>
			</PageScrollableContentWithShadow>
			<PageFooter isDirty={isDirty || allowFeaturePreviewSetting.changed}>
				<ButtonGroup>
					<Button onClick={() => reset({ featuresPreview: features })}>{t('Cancel')}</Button>
					<Button primary disabled={!(isDirty || allowFeaturePreviewSetting.changed)} onClick={handleSubmit(handleSave)}>
						{t('Save_changes')}
					</Button>
				</ButtonGroup>
			</PageFooter>
		</Page>
	);
};

export default AdminFeaturePreviewPage;
