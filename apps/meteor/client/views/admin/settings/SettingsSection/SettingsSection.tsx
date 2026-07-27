import type { LicenseModule } from '@rocket.chat/core-typings';
import { isSetting, isSettingColor } from '@rocket.chat/core-typings';
import { Box, Button, Callout, FieldGroup, Tag } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useLicenseBase } from '@rocket.chat/ui-client';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { links } from '../../../../lib/links';
import type { EditableSetting } from '../../EditableSettingsContext';
import { useEditableSettings, useEditableSettingsDispatch } from '../../EditableSettingsContext';
import Setting from '../Setting';

const PRICING_URL = links.go.pricing;

export type SettingsSectionProps = {
	groupId: string;
	hasReset?: boolean;
	sectionName: string;
	sectionTitle?: string;
	currentTab?: string;
	solo: boolean;
	help?: ReactNode;
	children?: ReactNode;
};

function SettingsSection({ groupId, hasReset = true, sectionTitle, sectionName, currentTab, help, children }: SettingsSectionProps) {
	const { t, i18n } = useTranslation();

	const editableSettings = useEditableSettings(
		useMemo(
			() => ({
				group: groupId,
				section: sectionName,
				tab: currentTab,
			}),
			[groupId, sectionName, currentTab],
		),
	);

	const changed = useMemo(() => editableSettings.some(({ changed }) => changed), [editableSettings]);

	// same semantics as useHasSettingModule, computed once for the whole section
	const { data: license } = useLicenseBase({
		select: (data) => ({ isEnterprise: Boolean(data?.license.license), activeModules: data?.license.activeModules ?? [] }),
	});
	const isPremiumLocked = useStableCallback((setting: EditableSetting): boolean => {
		if (!setting.enterprise) {
			return false;
		}
		const hasModules = Boolean(setting.modules?.length);
		return !(
			(license?.isEnterprise ?? false) &&
			hasModules &&
			(setting.modules ?? []).every((module) => license?.activeModules.includes(module as LicenseModule))
		);
	});

	// Group consecutive settings sharing the same `subsection` so each block can
	// be rendered as a captioned card; settings without a subsection keep the
	// plain layout.
	const subsectionGroups = useMemo(() => {
		const groups: { subsection: string; settings: EditableSetting[] }[] = [];
		for (const setting of editableSettings) {
			const subsection = setting.subsection ?? '';
			const lastGroup = groups[groups.length - 1];
			if (lastGroup?.subsection === subsection) {
				lastGroup.settings.push(setting);
			} else {
				groups.push({ subsection, settings: [setting] });
			}
		}
		return groups;
	}, [editableSettings]);

	const canReset = useMemo(
		() => editableSettings.some(({ value, packageValue }) => JSON.stringify(value) !== JSON.stringify(packageValue)),
		[editableSettings],
	);

	const dispatch = useEditableSettingsDispatch();

	const reset = useStableCallback(() => {
		dispatch(
			editableSettings
				.filter(({ disabled }) => !disabled)
				.map((setting) => {
					if (isSettingColor(setting)) {
						return {
							_id: setting._id,
							value: setting.packageValue,
							editor: setting.packageEditor,
							changed:
								JSON.stringify(setting.value) !== JSON.stringify(setting.packageValue) ||
								JSON.stringify(setting.editor) !== JSON.stringify(setting.packageEditor),
						};
					}
					return {
						_id: setting._id,
						value: setting.packageValue,
						changed: JSON.stringify(setting.value) !== JSON.stringify(setting.packageValue),
					};
				}),
		);
	});

	const handleResetSectionClick = (): void => {
		reset();
	};

	const sectionDescriptionKey = sectionName && `${sectionName}_Description`;
	const sectionDescription =
		sectionDescriptionKey && i18n.exists(sectionDescriptionKey) ? t(sectionDescriptionKey as TranslationKey) : undefined;

	const title = sectionTitle || (sectionName && t(sectionName as TranslationKey));

	return (
		// scroll-margin keeps anchored sections clear of the page header when navigating via the TOC
		<Box is='section' data-qa-section={sectionName} marginBlockEnd='x48' style={{ scrollMarginBlockStart: '1.75rem' }}>
			{title && (
				<Box is='h2' fontScale='h3' color='titles-labels' marginBlockEnd='x4'>
					{title}
				</Box>
			)}
			{sectionDescription && (
				<Box is='p' color='hint' fontScale='p2' marginBlockEnd='x16'>
					{sectionDescription}
				</Box>
			)}
			{help && (
				<Box is='p' color='hint' fontScale='p2'>
					{help}
				</Box>
			)}
			{subsectionGroups.map(({ subsection, settings }, index) => {
				// premium gating (v3): a fully-premium block advertises once — Premium tag
				// in the block header plus, while the license does not cover it, a single
				// upgrade callout — and its rows stay clean; anywhere else each premium
				// setting carries its own tag (+ upgrade link when locked) above the field,
				// with no grouping wrapper for consecutive premium rows.
				const allPremium = settings.length > 0 && settings.every((setting) => Boolean(setting.enterprise));
				const allLocked = settings.length > 0 && settings.every((setting) => isPremiumLocked(setting));

				return (
					<Box key={subsection || `ungrouped-${index}`} marginBlockEnd='x24'>
						{(subsection || allPremium) && (
							<Box display='flex' alignItems='center' marginBlockEnd='x8' style={{ gap: '0.5rem' }}>
								{subsection && (
									<Box fontScale='micro' textTransform='uppercase' color='hint'>
										{i18n.exists(subsection) ? t(subsection as TranslationKey) : subsection}
									</Box>
								)}
								{allPremium && <Tag variant='featured'>{t('Premium')}</Tag>}
							</Box>
						)}
						{allLocked && (
							<Box marginBlockEnd='x8'>
								<Callout type='info' title={t('Premium_feature')}>
									{t('Premium_settings_callout_description')}
									<Box marginBlockStart='x8'>
										<Button primary small is='a' href={PRICING_URL} target='_blank' rel='noopener noreferrer'>
											{t('Upgrade_to_Premium')}
										</Button>
									</Box>
								</Callout>
							</Box>
						)}
						<Box backgroundColor='light' borderRadius='x8' padding='x20'>
							<FieldGroup>
								{settings.map(
									(setting) =>
										isSetting(setting) && (
											<Setting
												key={setting._id}
												settingId={setting._id}
												sectionChanged={changed}
												premiumCta={allPremium ? 'none' : 'link'}
											/>
										),
								)}
							</FieldGroup>
						</Box>
					</Box>
				);
			})}
			{children && <FieldGroup>{children}</FieldGroup>}
			{hasReset && canReset && (
				<Button secondary danger marginBlockStart='x16' data-section={sectionName} onClick={handleResetSectionClick}>
					{t('Reset_section_settings')}
				</Button>
			)}
		</Box>
	);
}

export default SettingsSection;
