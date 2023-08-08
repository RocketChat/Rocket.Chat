import { Accordion, Box, Button, ButtonGroup, Field, Select, Tag, ToggleSwitch } from '@rocket.chat/fuselage';
import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import type { FontSize } from '@rocket.chat/rest-typings';
import { ExternalLink } from '@rocket.chat/ui-client';
import { useRouter, useSetModal, useTranslation, useToastMessageDispatch, useUserPreference, useEndpoint } from '@rocket.chat/ui-contexts';
import type { ThemePreference } from '@rocket.chat/ui-theming/src/types/themes';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';

import Page from '../../../components/Page';
import { useIsEnterprise } from '../../../hooks/useIsEnterprise';
import HighContrastUpsellModal from '../themes/HighContrastUpsellModal';
import { themeItems as themes } from '../themes/themeItems';
import { fontSizes } from './fontSizes';
import { useAdjustableFontSize } from './hooks/useAdsjustableFontSize';

const AccessibilityPage = () => {
	const t = useTranslation();

	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();
	const router = useRouter();
	const { data: license } = useIsEnterprise();

	const [fontSize, setFontSize] = useAdjustableFontSize();

	const themePreference = useUserPreference<ThemePreference>('themeAppearence') || 'auto';
	const [prevTheme, setPrevTheme] = useLocalStorage('prevTheme', themePreference);

	const setUserPreferences = useEndpoint('POST', '/v1/users.setPreferences');

	const {
		formState: { isDirty, dirtyFields },
		handleSubmit,
		control,
		reset,
	} = useForm({
		defaultValues: { highContrast: themePreference === 'high-contrast', fontSize },
	});

	const handleSave = async ({ highContrast, fontSize }: { highContrast: boolean; fontSize: FontSize }) => {
		try {
			dirtyFields.highContrast && (await setUserPreferences({ data: { themeAppearence: highContrast ? 'high-contrast' : prevTheme } }));
			dirtyFields.fontSize && (await setUserPreferences({ data: { fontSize } }));
			dispatchToastMessage({ type: 'success', message: t('Preferences_saved') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			if (dirtyFields.highContrast) {
				setPrevTheme(themePreference);
			}
			if (dirtyFields.fontSize) {
				setFontSize(fontSize);
			}
			reset({ highContrast, fontSize });
		}
	};

	const highContrastItem = themes.find((theme) => theme.id === 'high-contrast');
	const communityDisabled = highContrastItem && 'isEEOnly' in highContrastItem && highContrastItem.isEEOnly && !license?.isEnterprise;

	return (
		<Page>
			<Page.Header title={t('Accessibility')}>
				<ButtonGroup>
					<Button primary disabled={!isDirty} onClick={handleSubmit(handleSave)}>
						{t('Save_changes')}
					</Button>
				</ButtonGroup>
			</Page.Header>
			<Page.ScrollableContentWithShadow>
				<Box maxWidth='x600' w='full' alignSelf='center' mb={40} mi={36}>
					<Box fontScale='p1' mbe={24}>
						<Box pb={16}>{t('Accessibility_activation')}</Box>
					</Box>
					<Accordion.Item defaultExpanded={true} title={t('Readability')}>
						<Field>
							<Field.Label fontScale='p2b' mbe={12}>
								{t('Font_size')}
							</Field.Label>
							<Field.Row>
								<Controller
									control={control}
									name='fontSize'
									render={({ field: { onChange, value } }) => <Select value={value} onChange={onChange} options={fontSizes} />}
								/>
							</Field.Row>
							<Field.Description mb={12}>{t('Adjustable_font_size_description')}</Field.Description>
						</Field>
					</Accordion.Item>
					<Accordion.Item defaultExpanded={true} title={t('Theme')}>
						{highContrastItem && (
							<Field>
								<Box display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
									<Field.Label fontScale='p2b' display='flex' alignItems='center' htmlFor={highContrastItem.id}>
										{t.has(highContrastItem.title) ? t(highContrastItem.title) : highContrastItem.title}
										{communityDisabled && (
											<Box is='span' mis={8}>
												<Tag variant='featured'>{t('Enterprise')}</Tag>
											</Box>
										)}
									</Field.Label>
									<Field.Row>
										{communityDisabled ? (
											<ToggleSwitch onClick={() => setModal(<HighContrastUpsellModal onClose={() => setModal(null)} />)} checked={false} />
										) : (
											<Controller
												control={control}
												name='highContrast'
												render={({ field: { onChange, value } }) => <ToggleSwitch checked={value} onChange={onChange} />}
											/>
										)}
									</Field.Row>
								</Box>
								<Field.Hint mbs={12} style={{ whiteSpace: 'break-spaces' }}>
									{t.has(highContrastItem.description) ? t(highContrastItem.description) : highContrastItem.description}
									{highContrastItem.externalLink && communityDisabled && (
										<Box mbs={12}>
											<ExternalLink to={highContrastItem.externalLink}>{t('Talk_to_an_expert')}</ExternalLink>
										</Box>
									)}
								</Field.Hint>
							</Field>
						)}

						<Button mbs={32} onClick={() => router.navigate('/account/theme')}>
							See all themes
						</Button>
					</Accordion.Item>
				</Box>
			</Page.ScrollableContentWithShadow>
		</Page>
	);
};

export default AccessibilityPage;
