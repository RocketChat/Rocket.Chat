import type { ISetting, ISettingColor } from '@rocket.chat/core-typings';
import { Box, Button, ButtonGroup } from '@rocket.chat/fuselage';
import { useMediaQuery, useStableCallback } from '@rocket.chat/fuselage-hooks';
import { Page, PageHeader, PageScrollableContentWithShadow, PageFooter } from '@rocket.chat/ui-client';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useToastMessageDispatch, useSettingsDispatch, useSettings } from '@rocket.chat/ui-contexts';
import type { ReactNode, MouseEvent, SubmitEvent } from 'react';
import { useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';

import type { EditableSetting } from '../../EditableSettingsContext';
import { useEditableSettingsDispatch, useEditableSettings, useEditableSettingsGroupSections } from '../../EditableSettingsContext';
import SettingsSectionsToc from '../SettingsSectionsToc';

// width of the fixed section TOC (x248) plus the scrollbar gutter it is inset by
const TOC_RESERVED_WIDTH = 'x260';

export type SettingsGroupPageProps = {
	children: ReactNode;
	headerButtons?: ReactNode;
	onClickBack?: () => void;
	_id: string;
	i18nLabel: string;
	i18nDescription?: string;
	tabs?: ReactNode;
	isCustom?: boolean;
};

const SettingsGroupPage = ({
	children = undefined,
	headerButtons = undefined,
	onClickBack,
	_id,
	i18nLabel,
	tabs = undefined,
	isCustom = false,
}: SettingsGroupPageProps) => {
	const { t } = useTranslation();
	const dispatch = useSettingsDispatch();
	const dispatchToastMessage = useToastMessageDispatch();

	const groupSections = useEditableSettingsGroupSections(_id);
	// below the 1024px breakpoint the TOC is dropped entirely to give the room back to the content
	const isLargeViewport = useMediaQuery('(min-width: 1024px)');
	const hasToc = useMemo(() => isLargeViewport && groupSections.filter((name) => name).length >= 2, [isLargeViewport, groupSections]);

	const changedEditableSettings = useEditableSettings(
		useMemo(
			() => ({
				group: _id,
				changed: true,
			}),
			[_id],
		),
	);

	const hasInvalidSetting = changedEditableSettings.some((setting) => setting.invalid);
	const isSaveDisabled = changedEditableSettings.length === 0 || hasInvalidSetting;

	const originalSettings = useSettings(
		useMemo(
			() => ({
				_id: changedEditableSettings.map(({ _id }) => _id),
			}),
			[changedEditableSettings],
		),
	);

	const isColorSetting = (setting: ISetting): setting is ISettingColor => setting.type === 'color';

	const save = useStableCallback(async () => {
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

		if (isSaveDisabled) {
			return;
		}

		try {
			await dispatch(changes, () => dispatchToastMessage({ type: 'success', message: t('Settings_updated') }));
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const dispatchToEditing = useEditableSettingsDispatch();

	const cancel = useStableCallback(() => {
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
		dispatchToEditing(settingsToDispatch as Partial<EditableSetting>[]);
	});

	const handleSubmit = (event: SubmitEvent<HTMLFormElement>): void => {
		event.preventDefault();
		save();
	};

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

	const isTranslationKey = (key: string): key is TranslationKey => (key as TranslationKey) !== undefined;

	return (
		<Page is='form' action='#' method='post' onSubmit={handleSubmit}>
			<PageHeader backgroundColor='tint' onClickBack={onClickBack} title={i18nLabel && isTranslationKey(i18nLabel) && t(i18nLabel)}>
				<ButtonGroup>{headerButtons}</ButtonGroup>
			</PageHeader>
			{tabs}
			{isCustom ? (
				children
			) : (
				<Box position='relative' display='flex' flexDirection='column' flexGrow={1} flexShrink={1} overflow='hidden' backgroundColor='tint'>
					{/* rendered before the settings list so keyboard users reach the section navigation first; overlaid on
					    the scroll area so the page scrollbar stays at the window edge (the inset keeps the gutter visible) */}
					{hasToc && (
						<Box position='absolute' insetBlockStart={0} insetBlockEnd={0} insetInlineEnd='x12' zIndex={1}>
							<SettingsSectionsToc groupId={_id} />
						</Box>
					)}
					<PageScrollableContentWithShadow backgroundColor='tint'>
						{/* the TOC width is reserved so the centered content never slides underneath it on narrow windows */}
						<Box width='full' paddingInlineEnd={hasToc ? TOC_RESERVED_WIDTH : undefined}>
							<Box marginBlock='none' marginInline='auto' width='full' maxWidth='x580'>
								{children}
							</Box>
						</Box>
					</PageScrollableContentWithShadow>
				</Box>
			)}
			<PageFooter isDirty={!(changedEditableSettings.length === 0)}>
				<ButtonGroup>
					{changedEditableSettings.length > 0 && (
						<Button type='reset' onClick={handleCancelClick}>
							{t('Cancel')}
						</Button>
					)}
					<Button className='save' disabled={isSaveDisabled} primary type='submit' onClick={handleSaveClick}>
						{t('Save_changes')}
					</Button>
				</ButtonGroup>
			</PageFooter>
		</Page>
	);
};

export default memo(SettingsGroupPage);
