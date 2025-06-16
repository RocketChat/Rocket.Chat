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

// Simulates an API call with a random delay
const simulateApiCall = (output: string, delay: number): Promise<string> =>
  new Promise((resolve) => setTimeout(() => resolve(output), delay));

const placeholderPattern = (type: EnhancementOption) => `<aienhanced placeholder data-type="${type}">{{text}}</aienhanced placeholder>`;

const MessageBoxEnhancementToolbar = ({ composer, disabled }: MessageBoxEnhancementToolbarProps) => {
  // const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const handleEnhancement = async (type: EnhancementOption, option?: string) => {
    const fullText = composer.text;
    if (!fullText.trim()) return;

    const { start, end } = composer.selection ?? { start: 0, end: fullText.length };
    const selectedText = fullText.slice(start, end);
    console.log('Selected text:', JSON.stringify(selectedText));
    if (!selectedText) return;

    // setLoading(true);

    // Wrap selected text with placeholder tags using wrapSelection
    composer.wrapSelection(placeholderPattern(type));

    // Simulate API response label
    let apiLabel = '';
    switch (type) {
      case 'tone': apiLabel = 'Tone_Enhanced'; break;
      case 'translate': apiLabel = 'Translation_Enhanced'; break;
      case 'summarize': apiLabel = 'Summarized_Text'; break;
    }

    try {
      const delay = Math.floor(Math.random() * 15000) + 15000;
      const response = await simulateApiCall(apiLabel, delay);

      // Build final replacement: add dashes around the response text
      const responseWrapped = selectedText.split('\n')
        .map(line => '-'.repeat(line.length) + response + '-'.repeat(line.length))
        .join('\n');

      // Now replace placeholder block with the API response
      const current = composer.text;
      const placeholderStart = `<aienhanced placeholder data-type=\"${type}\">`;// I need to put different id for every placeholder to avoid conflicts
      const startIndex = current.indexOf(placeholderStart);
      if (startIndex !== -1) {
        const endIndex = current.indexOf(`</aienhanced placeholder>`, startIndex) + `</aienhanced placeholder>`.length;
        composer.replaceText(responseWrapped, { start: startIndex, end: endIndex });
      } else {
        // Fallback: insert response after
        composer.insertText(responseWrapped);
      }
    } catch (error) {
      console.error('Enhancement failed:', error);
      // On error, restore original selection
      composer.replaceText(selectedText, { start, end });
    } finally {
      // setLoading(false);
    }
  };

  return (
    <>
      {/* {loading && (
        <Box position="absolute" style={{ top: 8, right: 8, paddingInline: 24, paddingBlock: 12 }}>
          <Throbber size='x12' />
        </Box>
      )} */}

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
