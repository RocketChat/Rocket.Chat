import { Box, Button, ButtonGroup, Modal, Icon } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useEmojiPicker } from '../../../contexts/EmojiPickerContext';

type PresetReaction = {
emoji: string;
label?: string;
};

type PresetReactionsModalProps = {
initialPresetReactions?: PresetReaction[];
onConfirm: (presetReactions: PresetReaction[]) => void;
onCancel: () => void;
};

const PresetReactionsModal = ({ initialPresetReactions = [], onConfirm, onCancel }: PresetReactionsModalProps): ReactElement => {
const { t } = useTranslation();
const [selectedReactions, setSelectedReactions] = useState<PresetReaction[]>(initialPresetReactions);
const emojiPickerRef = useRef<HTMLButtonElement>(null);
const { open: openEmojiPicker } = useEmojiPicker();

const handleAddEmoji = () => {
if (!emojiPickerRef.current) {
return;
}

openEmojiPicker(emojiPickerRef.current, (emoji: string) => {
// Format emoji with colons if not already formatted
const formattedEmoji = emoji.startsWith(':') ? emoji : `:${emoji}:`;

// Check if already selected
if (!selectedReactions.some((r) => r.emoji === formattedEmoji)) {
setSelectedReactions((prev) => [...prev, { emoji: formattedEmoji }]);
}
});
};

const handleRemoveEmoji = (emoji: string) => {
setSelectedReactions((prev) => prev.filter((r) => r.emoji !== emoji));
};

const handleConfirm = () => {
onConfirm(selectedReactions);
};

// Simple emoji rendering (will be properly rendered by the emoji system)
const emojiToDisplay = (emoji: string) => emoji.replace(/:/g, '');

return (
<Modal>
<Modal.Header>
<Modal.Title>{t('Select_Preset_Reactions')}</Modal.Title>
<Modal.Close onClick={onCancel} />
</Modal.Header>
<Modal.Content>
<Box mb={16}>
<Box fontScale='p2' color='hint' mb={16}>
{t('Preset_Reactions_Description')}
</Box>

<Box mb={16}>
<Box fontScale='p2' fontWeight='bold' mb={8}>
{t('Selected')} ({selectedReactions.length}):
</Box>
{selectedReactions.length > 0 ? (
<Box display='flex' flexWrap='wrap' gap={8} mb={8}>
{selectedReactions.map((preset) => (
<Box
key={preset.emoji}
display='flex'
alignItems='center'
p={8}
borderRadius={4}
bg='surface-selected'
style={{ cursor: 'pointer' }}
onClick={() => handleRemoveEmoji(preset.emoji)}
title={`${preset.emoji} - Click to remove`}
>
<Box is='span' fontSize='x20' lineHeight='1'>
{emojiToDisplay(preset.emoji)}
</Box>
<Icon name='cross-small' size='x16' mis={4} />
</Box>
))}
</Box>
) : (
<Box fontScale='p2' color='hint' mb={8}>
{t('No_reactions_selected')}
</Box>
)}
</Box>

<Button ref={emojiPickerRef} onClick={handleAddEmoji} icon='emoji' secondary>
{t('Add_Emoji')}
</Button>
</Box>
</Modal.Content>
<Modal.Footer>
<ButtonGroup align='end'>
<Button onClick={onCancel}>{t('Cancel')}</Button>
<Button primary onClick={handleConfirm} disabled={selectedReactions.length === 0}>
{t('Confirm')}
</Button>
</ButtonGroup>
</Modal.Footer>
</Modal>
);
};

export default PresetReactionsModal;
