import type { ISetting, ISettingColor } from '@rocket.chat/core-typings';
import { Accordion, Box, Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import {
	useToastMessageDispatch,
	useUser,
	useSettingsDispatch,
	useSettings,
	useTranslation,
	useLoadLanguage,
	TranslationKey,
	useRoute,
} from '@rocket.chat/ui-contexts';
import React, { useMemo, memo, FC, ReactNode, FormEvent, MouseEvent } from 'react';

import Page from '../../../components/Page';
import { useEditableSettingsDispatch, useEditableSettings, IEditableSetting } from '../EditableSettingsContext';
import GroupPageSkeleton from './GroupPageSkeleton';

type GroupPageProps = {
	children: ReactNode;
	headerButtons?: ReactNode;
	_id: string;
	i18nLabel: string;
	i18nDescription?: string;
	tabs?: ReactNode;
	isCustom?: boolean;
};

const GroupPage: FC<GroupPageProps> = ({
	children = undefined,
	headerButtons = undefined,
	_id,
	i18nLabel,
	i18nDescription = undefined,
	tabs = undefined,
	isCustom = false,
}) => {
	const t = useTranslation();
	const user = useUser();
	const router = useRoute('admin-settings');
	const dispatch = useSettingsDispatch();
	const dispatchToastMessage = useToastMessageDispatch();
	const loadLanguage = useLoadLanguage();

	const changedEditableSettings = useEditableSettings(
		useMemo(
			() => ({
				group: _id,
				changed: true,
			}),
			[_id],
		),
	);

	const originalSettings = useSettings(
		useMemo(
			() => ({
				_id: changedEditableSettings.map(({ _id }) => _id),
			}),
			[changedEditableSettings],
		),
	);

	const isColorSetting = (setting: ISetting): setting is ISettingColor => setting.type === 'color';

	const save = useMutableCallback(async () => {
		const changes = changedEditableSettings.map((setting) => {
			if (isColorSetting(setting)) {
				return {
					_id: setting._id,
					value: setting.value,
					editor: setting.editor,
				};
			}

			return {
				_id: setting._id,
				value: setting.value,
			};
		});

		if (changes.length === 0) {
			return;
		}

		try {
			await dispatch(changes);

			if (changes.some(({ _id }) => _id === 'Language')) {
				const lng = user?.language || changes.filter(({ _id }) => _id === 'Language').shift()?.value || 'en';
				if (typeof lng === 'string') {
					await loadLanguage(lng);
					dispatchToastMessage({ type: 'success', message: t('Settings_updated', { lng }) });
					return;
				}
				throw new Error('lng is not a string');
			}

			dispatchToastMessage({ type: 'success', message: t('Settings_updated') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error as string });
		}
	});

	const dispatchToEditing = useEditableSettingsDispatch();

	const cancel = useMutableCallback(() => {
		const settingsToDispatch = changedEditableSettings
			.map(({ _id }) => originalSettings.find((setting) => setting._id === _id))
			.map((setting) => {
				if (!setting) {
					return;
				}

				if (isColorSetting(setting)) {
					return {
						_id: setting._id,
						value: setting.value,
						editor: setting.editor,
						changed: false,
					};
				}

				return {
					_id: setting._id,
					value: setting.value,
					changed: false,
				};
			})
			.filter(Boolean);
		dispatchToEditing(settingsToDispatch as Partial<IEditableSetting>[]);
	});

	const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
		event.preventDefault();
		save();
	};

	const handleBack = useMutableCallback(() => router.push({}));

	const handleCancelClick = (event: MouseEvent<HTMLOrSVGElement>): void => {
		event.preventDefault();
		cancel();
	};

	const handleSaveClick = (event: MouseEvent<HTMLOrSVGElement>): void => {
		event.preventDefault();
		save();
	};

	if (!_id) {
		return <Page>{children}</Page>;
	}

	// The settings
	const isTranslationKey = (key: string): key is TranslationKey => (key as TranslationKey) !== undefined;

	return (
		<Page is='form' action='#' method='post' onSubmit={handleSubmit}>
			<Page.Header onClickBack={handleBack} title={i18nLabel && isTranslationKey(i18nLabel) && t(i18nLabel)}>
				<ButtonGroup>
					{changedEditableSettings.length > 0 && (
						<Button danger primary type='reset' onClick={handleCancelClick}>
							{t('Cancel')}
						</Button>
					)}
					<Button
						children={t('Save_changes')}
						className='save'
						disabled={changedEditableSettings.length === 0}
						primary
						type='submit'
						onClick={handleSaveClick}
					/>
					{headerButtons}
				</ButtonGroup>
			</Page.Header>

			{tabs}

			{isCustom ? (
				children
			) : (
				<Page.ScrollableContentWithShadow>
					<Box marginBlock='none' marginInline='auto' width='full' maxWidth='x580'>
						{i18nDescription && isTranslationKey(i18nDescription) && t.has(i18nDescription) && (
							<Box is='p' color='hint' fontScale='p2'>
								{t(i18nDescription)}
							</Box>
						)}

						<Accordion className='page-settings'>{children}</Accordion>
					</Box>
				</Page.ScrollableContentWithShadow>
			)}
		</Page>
	);
};

export default Object.assign(memo(GroupPage), {
	Skeleton: GroupPageSkeleton,
});
