import { Box, Button, ButtonGroup, Modal } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

type PresetReaction = {
	emoji: string;
	label?: string;
};

type PresetReactionsModalProps = {
	initialPresetReactions?: PresetReaction[];
	onConfirm: (presetReactions: PresetReaction[]) => void;
	onCancel: () => void;
};

// Common emojis that users might want to preset
const COMMON_EMOJIS = [
	':+1:',
	':-1:',
	':heart:',
	':tada:',
	':clap:',
	':fire:',
	':rocket:',
	':eyes:',
	':raised_hands:',
	':100:',
	':white_check_mark:',
	':x:',
	':thinking_face:',
	':smile:',
	':laughing:',
	':cry:',
	':pray:',
	':muscle:',
	':sparkles:',
	':star:',
];

// Simple emoji rendering (will be properly rendered by the emoji system)
const emojiToDisplay = (emoji: string) => emoji.replace(/:/g, '');

const PresetReactionsModal = ({ initialPresetReactions = [], onConfirm, onCancel }: PresetReactionsModalProps): ReactElement => {
	const { t } = useTranslation();
	const [selectedReactions, setSelectedReactions] = useState<PresetReaction[]>(initialPresetReactions);

	const handleEmojiClick = (emoji: string) => {
		setSelectedReactions((prev) => {
			const existingIndex = prev.findIndex((p) => p.emoji === emoji);
			if (existingIndex >= 0) {
				return prev.filter((_, i) => i !== existingIndex);
			}
			return [...prev, { emoji }];
		});
	};

	const isSelected = (emoji: string) => selectedReactions.some((p) => p.emoji === emoji);

	const handleConfirm = () => {
		onConfirm(selectedReactions);
	};

	return (
		<Modal>
			<Modal.Header>
				<Modal.Title>{t('Select_Preset_Reactions')}</Modal.Title>
				<Modal.Close onClick={onCancel} />
			</Modal.Header>
			<Modal.Content>
				<Box mb={16}>
					<Box fontScale='p2' color='hint' mb={8}>
						{t('Preset_Reactions_Description')}
					</Box>
					{selectedReactions.length > 0 && (
						<Box mb={16}>
							<Box fontScale='p2' fontWeight='bold' mb={8}>
								{t('Selected')}:
							</Box>
							<Box display='flex' flexWrap='wrap' gap={8}>
								{selectedReactions.map((preset) => (
									<Box
										key={preset.emoji}
										p={8}
										borderRadius={4}
										bg='surface-selected'
										style={{ cursor: 'pointer' }}
										onClick={() => handleEmojiClick(preset.emoji)}
										title={preset.emoji}
									>
										{emojiToDisplay(preset.emoji)}
									</Box>
								))}
							</Box>
						</Box>
					)}
					<Box fontScale='p2' fontWeight='bold' mb={8}>
						{t('Available_Reactions')}:
					</Box>
					<Box display='flex' flexWrap='wrap' gap={8}>
						{COMMON_EMOJIS.map((emoji) => (
							<Box
								key={emoji}
								p={8}
								borderRadius={4}
								bg={isSelected(emoji) ? 'surface-selected' : 'surface-neutral'}
								style={{ cursor: 'pointer' }}
								onClick={() => handleEmojiClick(emoji)}
								title={emoji}
							>
								{emojiToDisplay(emoji)}
							</Box>
						))}
					</Box>
				</Box>
			</Modal.Content>
			<Modal.Footer>
				<ButtonGroup align='end'>
					<Button onClick={onCancel}>{t('Cancel')}</Button>
					<Button primary onClick={handleConfirm}>
						{t('Confirm')}
					</Button>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>
	);
};

export default PresetReactionsModal;

