import { MessageComposerAction } from '@rocket.chat/ui-composer';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ComposerAPI } from '../../../../../lib/chats/ChatAPI';
import EnhancementToolbarDropdown from './EnhancementToolbarDropdown';
import { Box, Throbber } from '@rocket.chat/fuselage';

type EnhancementOption = 'tone' | 'translate' | 'summarize';

type MessageBoxEnhancementToolbarProps = {
  composer: ComposerAPI;
  disabled: boolean;
};

const toneOptions = ['polite', 'confident', 'to the point', 'clear', 'descriptive'] as const;
const translationOptions = [
  'Korean', 'German', 'Italian', 'Vietnamese', 'Polish', 'French',
  'Spanish', 'Chinese', 'Japanese', 'Russian', 'Portuguese', 'Hindi', 'Arabic', 'Dutch'
] as const;

// API call simulation function
const simulateApiCall = (output: string, delay: number): Promise<string> =>
  new Promise((resolve) => setTimeout(() => resolve(output), delay));

const MessageBoxEnhancementToolbar = ({ composer, disabled }: MessageBoxEnhancementToolbarProps) => {
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const [enhancementCount, setEnhancementCount] = useState(0);

  const handleEnhancement = async (type: EnhancementOption, option?: string) => {
    const fullText = composer.text;
    if (!fullText.trim()) return;

    const { start, end } = composer.selection ?? { start: 0, end: fullText.length };
    const selectedText = fullText.slice(start, end);
    if (!selectedText) return;

    let apiLabel = '';
    switch (type) {
      case 'tone': apiLabel = 'Tone_Enhanced'; break;
      case 'translate': apiLabel = 'Translation_Enhanced'; break;
      case 'summarize': apiLabel = 'Summarized_Text'; break;
    }

    setEnhancementCount(count => count + 1);
    const placeholderTagStart = `<aienhanced placeholder>`;
    const placeholderTagEnd = `</aienhanced placeholder>`;

    // Split on newline to preserve <br> positions
    const lines = selectedText.split('\n');
    const placeholderLines = lines.map(line => 
      `${placeholderTagStart}${line}${placeholderTagEnd}`
    );
    const placeholderText = placeholderLines.join('\n');

    setLoading(true);
    try {
      // Wrap selected text in placeholder tags
      composer.replaceText(placeholderText, { start, end });

      // Simulate API delay
      const delay = Math.floor(Math.random() * 15000) + 15000;
      const response = await simulateApiCall(apiLabel, delay);

      // Build response lines: add dashes equal to original line length around response
      const responseLines = lines.map(line => {
        const dashCount = line.length;
        const dashes = '-'.repeat(dashCount);
        return `${dashes}${response}${dashes}`;
      });
      const finalText = responseLines.join('\n');

      // Replace placeholder-wrapped text in composer
      const currentText = composer.text;
      const selStart = currentText.indexOf(placeholderTagStart, start);
      const selEnd = selStart + placeholderText.length;
      if (selStart !== -1) {
        composer.replaceText(finalText, { start: selStart, end: selEnd });
      } else {
        composer.insertText(finalText);
      }
    } catch (err) {
      console.error(err);
      // On error, restore original selected text
      composer.replaceText(selectedText, { start, end });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && (
        <Box position="absolute" style={{ top: 8, right: 8, paddingInline: 24, paddingBlock: 12 }}>
          <Throbber size='x12' />
        </Box>
      )}

      <MessageComposerAction
        icon='sheet'
        title={t('Summarize')}
        disabled={disabled}
        onClick={() => handleEnhancement('summarize')}
      />

      <EnhancementToolbarDropdown
        type='tone'
        options={toneOptions.map(o => ({ id: o, label: o }))}
        onSelect={opt => handleEnhancement('tone', opt)}
        disabled={disabled}
      />

      <EnhancementToolbarDropdown
        type='translate'
        options={translationOptions.map(o => ({ id: o, label: o }))}
        onSelect={opt => handleEnhancement('translate', opt)}
        disabled={disabled}
      />
    </>
  );
};

export default memo(MessageBoxEnhancementToolbar);
