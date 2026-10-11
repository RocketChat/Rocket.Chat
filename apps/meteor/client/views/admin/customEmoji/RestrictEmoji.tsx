import { Box, Button, ButtonGroup, Chip, Field, FieldHint, FieldLabel, FieldRow } from '@rocket.chat/fuselage';
import { ContextualbarScrollableContent, ContextualbarFooter } from '@rocket.chat/ui-client';
import { useToastMessageDispatch, useSetting, useSettingsDispatch } from '@rocket.chat/ui-contexts';
import type { ReactElement, MouseEvent } from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import Emoji from '../../../components/Emoji';
import { useEmojiPicker } from '../../../contexts/EmojiPickerContext';
import { getEmojiNameWithoutTone, parseRestrictedEmojis } from '../../../../lib/emoji/restrictedEmojis';

type RestrictEmojiProps = {
	close: () => void;
};

const RestrictEmoji = ({ close }: RestrictEmojiProps): ReactElement => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const dispatchSettings = useSettingsDispatch();
	const { open: openEmojiPicker } = useEmojiPicker();
	const addButtonRef = useRef<HTMLButtonElement>(null);

	const restrictedEmojisSetting = useSetting<string>('Emoji_Restricted_For_Users', '');
	const [restrictedEmojis, setRestrictedEmojis] = useState(() => parseRestrictedEmojis(restrictedEmojisSetting));

	const restrictedEmojisValue = useMemo(() => restrictedEmojis.join(','), [restrictedEmojis]);

	const handleRemoveEmoji = (emojiName: string) => (): void => {
		setRestrictedEmojis((current) => current.filter((item) => item !== emojiName));
	};

	const handleAddEmoji = useCallback(
		(event: MouseEvent<HTMLButtonElement>): void => {
			openEmojiPicker(
				addButtonRef.current ?? event.currentTarget,
				(emojiName) => {
					const normalized = getEmojiNameWithoutTone(emojiName);
					if (!normalized) {
						return;
					}

					setRestrictedEmojis((current) => (current.includes(normalized) ? current : [...current, normalized]));
				},
				{ keepOpen: true },
			);
		},
		[openEmojiPicker],
	);

	const handleSave = useCallback(async () => {
		try {
			await dispatchSettings([{ _id: 'Emoji_Restricted_For_Users', value: restrictedEmojisValue }]);
			dispatchToastMessage({ type: 'success', message: t('Emoji_Restrictions_Updated_Successfully') });
			close();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [restrictedEmojisValue, dispatchSettings, dispatchToastMessage, t, close]);

	return (
		<>
			<ContextualbarScrollableContent>
				<Field>
					<FieldLabel>{t('Restricted_Emojis')}</FieldLabel>
					{restrictedEmojis.length > 0 ? (
						<FieldRow>
							<Box display='flex' flexWrap='wrap'>
								{restrictedEmojis.map((emojiName) => (
									<Chip key={emojiName} mie={4} mbe={4} onClick={handleRemoveEmoji(emojiName)}>
										<Box is='span' display='flex' alignItems='center'>
											<Emoji emojiHandle={`:${emojiName}:`} />
											<Box mis={4} withTruncatedText>
												{emojiName}
											</Box>
										</Box>
									</Chip>
								))}
							</Box>
						</FieldRow>
					) : (
						<Box color='hint' fontScale='p2'>
							{t('Restricted_Emojis_Empty')}
						</Box>
					)}
					<FieldRow mbs={12}>
						<Button ref={addButtonRef} icon='emoji' onClick={handleAddEmoji}>
							{t('Add_emoji')}
						</Button>
					</FieldRow>
					<FieldHint mbs={12}>{t('Emoji_Restricted_For_Users_Description')}</FieldHint>
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
