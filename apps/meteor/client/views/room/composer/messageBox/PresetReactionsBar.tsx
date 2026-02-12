import { Box, MessageReaction as MessageReactionTemplate, MessageReactionEmoji, MessageReactionAction } from '@rocket.chat/fuselage';
import { useRef, type ReactElement, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';

import { getEmojiClassNameAndDataTitle } from '../../../../lib/utils/renderEmoji';

type PresetReaction = {
	emoji: string;
	label?: string;
};

type PresetReactionsBarProps = {
	presetReactions: PresetReaction[];
	onRemoveReaction: (emoji: string) => void;
	onAddReaction: (ref: RefObject<HTMLButtonElement>) => void;
};

const PresetReactionsBar = ({ presetReactions, onRemoveReaction, onAddReaction }: PresetReactionsBarProps): ReactElement | null => {
	const { t } = useTranslation();
	const emojiPickerButtonRef = useRef<HTMLButtonElement>(null);

	if (presetReactions.length === 0) {
		return null;
	}

	return (
		<Box display='flex' flexWrap='wrap' style={{ gap: '4px' }} padding={8} paddingBlock={4}>
			{presetReactions.map((preset) => {
				const emojiProps = getEmojiClassNameAndDataTitle(preset.emoji);

				return (
					<MessageReactionTemplate
						key={preset.emoji}
						mine={false}
						aria-label={t('Remove_preset_reaction', { reaction: preset.emoji })}
						title={t('Click_to_remove')}
						onClick={() => onRemoveReaction(preset.emoji)}
						role='button'
						tabIndex={0}
					>
						<MessageReactionEmoji {...emojiProps} />
					</MessageReactionTemplate>
				);
			})}
			<Box ref={emojiPickerButtonRef} display='inline-block'>
				<MessageReactionAction style={{ opacity: 1 }} title={t('Add_Reaction')} onClick={() => onAddReaction(emojiPickerButtonRef)} />
			</Box>
		</Box>
	);
};

export default PresetReactionsBar;
