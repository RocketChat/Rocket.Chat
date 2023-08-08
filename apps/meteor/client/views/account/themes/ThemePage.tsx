import { Accordion, Box, Button, ButtonGroup, Field, RadioButton, Tag } from '@rocket.chat/fuselage';
import { ExternalLink } from '@rocket.chat/ui-client';
import { useEndpoint, useSetModal, useToastMessageDispatch, useTranslation, useUserPreference } from '@rocket.chat/ui-contexts';
import type { ThemePreference } from '@rocket.chat/ui-theming/src/types/themes';
import React from 'react';
import { useForm } from 'react-hook-form';

import Page from '../../../components/Page';
import { useIsEnterprise } from '../../../hooks/useIsEnterprise';
import HighContrastUpsellModal from './HighContrastUpsellModal';
import { themeItems as themes } from './themeItems';

const ThemePage = () => {
	const t = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const { data: license } = useIsEnterprise();

	const themePreference = useUserPreference<ThemePreference>('themeAppearence') || 'auto';
	const setUserPreferences = useEndpoint('POST', '/v1/users.setPreferences');

	const {
		formState: { isDirty },
		handleSubmit,
		register,
		reset,
	} = useForm({
		defaultValues: { themeAppearence: themePreference },
	});

	const handleSave = async ({ themeAppearence }: { themeAppearence: ThemePreference }) => {
		try {
			await setUserPreferences({ data: { themeAppearence } });
			dispatchToastMessage({ type: 'success', message: t('Preferences_saved') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			reset({ themeAppearence });
		}
	};

	return (
		<Page>
			<Page.Header title={t('Theme')}>
				<ButtonGroup>
					<Button primary disabled={!isDirty} onClick={handleSubmit(handleSave)}>
						{t('Save_changes')}
					</Button>
				</ButtonGroup>
			</Page.Header>
			<Page.ScrollableContentWithShadow>
				<Box maxWidth='x600' w='full' alignSelf='center' mb={40} mi={36}>
					<Box fontScale='p1' mbe={24}>
						<Box pb={16}>{t('Choose_theme_description')}</Box>
					</Box>
					<Accordion>
						<Accordion.Item defaultExpanded={true} title={t('Theme')}>
							{themes.map(({ id, title, description, ...item }, index) => {
								const externalLink = 'externalLink' in item && item.externalLink;
								const communityDisabled = 'isEEOnly' in item && item.isEEOnly && !license?.isEnterprise;

								return (
									<Field key={id} pbe={themes.length - 1 ? undefined : 'x28'} pbs={index === 0 ? undefined : 'x28'}>
										<Box display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
											<Field.Label display='flex' alignItems='center' fontScale='p2b' htmlFor={id}>
												{t.has(title) ? t(title) : title}
												{communityDisabled && (
													<Box is='span' mis={8}>
														<Tag variant='featured'>{t('Enterprise')}</Tag>
													</Box>
												)}
											</Field.Label>
											<Field.Row>
												{communityDisabled ? (
													<RadioButton
														onClick={() => setModal(<HighContrastUpsellModal onClose={() => setModal(null)} />)}
														checked={false}
													/>
												) : (
													<RadioButton id={id} {...register('themeAppearence')} value={id} />
												)}
											</Field.Row>
										</Box>
										<Field.Hint mbs={12} style={{ whiteSpace: 'break-spaces' }}>
											{t.has(description) ? t(description) : description}
											{externalLink && communityDisabled && (
												<Box mbs={12}>
													<ExternalLink to={externalLink}>{t('Talk_to_an_expert')}</ExternalLink>
												</Box>
											)}
										</Field.Hint>
									</Field>
								);
							})}
						</Accordion.Item>
					</Accordion>
				</Box>
			</Page.ScrollableContentWithShadow>
		</Page>
	);
};

export default ThemePage;
