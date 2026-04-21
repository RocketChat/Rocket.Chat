import { Box, Button, ButtonGroup, Field, FieldLabel, FieldRow, FieldError, TextAreaInput } from '@rocket.chat/fuselage';
import { ContextualbarScrollableContent, ContextualbarFooter } from '@rocket.chat/ui-client';
import { useToastMessageDispatch, useSetting, useSettingsDispatch } from '@rocket.chat/ui-contexts';
import type { ReactElement, ChangeEvent } from 'react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

type RestrictEmojiProps = {
	close: () => void;
};

const RestrictEmoji = ({ close, ...props }: RestrictEmojiProps): ReactElement => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const dispatchSettings = useSettingsDispatch();

	const restrictedEmojisString = useSetting<string>('Emoji_Restricted_For_Users', '');
	const [restrictedEmojis, setRestrictedEmojis] = useState(restrictedEmojisString || '');
	const [error, setError] = useState(false);

	const handleChangeRestrictedEmojis = (e: ChangeEvent<HTMLTextAreaElement>): void => {
		if (error) {
			setError(false);
		}
		setRestrictedEmojis(e.currentTarget.value);
	};

	const handleSave = useCallback(async () => {
		try {
			await dispatchSettings([{ _id: 'Emoji_Restricted_For_Users', value: restrictedEmojis }]);
			dispatchToastMessage({ type: 'success', message: t('Emoji_Restrictions_Updated_Successfully') });
			close();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [restrictedEmojis, dispatchSettings, dispatchToastMessage, t, close]);

	return (
		<>
			<ContextualbarScrollableContent {...props}>
				<Field>
					<FieldLabel>{t('Restricted_Emojis')}</FieldLabel>
					<FieldRow>
						<TextAreaInput
							rows={6}
							value={restrictedEmojis}
							onChange={handleChangeRestrictedEmojis}
							placeholder={t('Restricted_Emojis_Placeholder')}
						/>
					</FieldRow>
					<FieldRow>
						<Box color='hint' fontSize='x12'>
							{t('Emoji_Restricted_For_Users_Description')}
						</Box>
					</FieldRow>
					{error && <FieldError>{t('error-the-field-is-required', { field: t('Restricted_Emojis') })}</FieldError>}
				</Field>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					<Button onClick={close}>{t('Cancel')}</Button>
					<Button primary onClick={handleSave}>
						{t('Save')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</>
	);
};

export default RestrictEmoji;
