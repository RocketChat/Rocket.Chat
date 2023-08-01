import { Accordion, Box, Button, ButtonGroup, Field, Select, Tag, ToggleSwitch } from '@rocket.chat/fuselage';
import { ExternalLink } from '@rocket.chat/ui-client';
import { useRouter, useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import Page from '../../../components/Page';
import { useIsEnterprise } from '../../../hooks/useIsEnterprise';
import HighContrastUpsellModal from '../themes/HighContrastUpsellModal';
import { themeItems as themes } from '../themes/themeItems';

const AccessibilityPage = () => {
	const t = useTranslation();
	const { data: license } = useIsEnterprise();
	const setModal = useSetModal();
	const router = useRouter();

	const highContrastItem = themes.find((theme) => theme.id === 'high-contrast');
	const communityDisabled = highContrastItem && 'isEEOnly' in highContrastItem && highContrastItem.isEEOnly && !license?.isEnterprise;

	return (
		<Page>
			<Page.Header title={t('Accessibility')}>
				<ButtonGroup>
					<Button primary>{t('Save_changes')}</Button>
				</ButtonGroup>
			</Page.Header>
			<Page.ScrollableContentWithShadow>
				<Box maxWidth='x600' w='full' alignSelf='center' mb='x40' mi='x36'>
					<Box fontScale='p1' mbe='x24'>
						<Box pb='x16'>{t('Accessibility_activation')}</Box>
					</Box>
					<Accordion.Item defaultExpanded={true} title={t('Readability')}>
						<Field>
							<Box fontScale='p2b' mbe='x12'>
								{t('Adjustable_font_size')}
							</Box>
							<Field.Label>{t('Font_size')}</Field.Label>
							<Field.Row>
								<Select
									options={[
										['100', '100%'],
										['80', '80%'],
									]}
								/>
							</Field.Row>
							<Field.Description mb='x12'>{t('Adjustable_font_size_description')}</Field.Description>
						</Field>
					</Accordion.Item>
					<Accordion.Item defaultExpanded={true} title={t('Theme')}>
						{highContrastItem && (
							<Field>
								<Box display='flex' flexDirection='row' justifyContent='spaceBetween' flexGrow={1}>
									<Field.Label display='flex' alignItems='center' htmlFor={highContrastItem.id}>
										{t.has(highContrastItem.title) ? t(highContrastItem.title) : highContrastItem.title}
										{communityDisabled && (
											<Box is='span' mis='x8'>
												<Tag variant='featured'>{t('Enterprise')}</Tag>
											</Box>
										)}
									</Field.Label>
									<Field.Row>
										{communityDisabled ? (
											<ToggleSwitch onClick={() => setModal(<HighContrastUpsellModal onClose={() => setModal(null)} />)} checked={false} />
										) : (
											<ToggleSwitch id={highContrastItem.id} /* {...register('themeAppearence')} value={id}  */ />
										)}
									</Field.Row>
								</Box>
								<Field.Hint mbs='x12' style={{ whiteSpace: 'break-spaces' }}>
									{t.has(highContrastItem.description) ? t(highContrastItem.description) : highContrastItem.description}
									{highContrastItem.externalLink && communityDisabled && (
										<Box mbs='x12'>
											<ExternalLink to={highContrastItem.externalLink}>{t('Talk_to_an_expert')}</ExternalLink>
										</Box>
									)}
								</Field.Hint>
							</Field>
						)}

						<Button mb='x12' onClick={() => router.navigate('/account/theme')}>
							See more themes
						</Button>
					</Accordion.Item>
				</Box>
			</Page.ScrollableContentWithShadow>
		</Page>
	);
};

export default AccessibilityPage;
