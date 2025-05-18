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
// Tone options via GenericMenu

const MessageBoxEnhancementToolbar = ({ composer, disabled }: MessageBoxEnhancementToolbarProps) => {
  const [Loading, setLoading] = useState(false);
  const {t} = useTranslation();
  const [aiEnahcementCounter, setAiEnhancementCounter] = useState(0);

  const handleEnhancement = async (type: EnhancementOption, option?: string) => {
    const text = composer.text.trim();
    if (!text) {
      return;
    }
    let payload: any;
    setLoading(true);
    switch (type) {
      case 'tone':
        payload = {
        //   model: 'llama-3.3-70b-versatile',
        //   messages: [{ role: 'user', content: `Change the tone of the following sentence to ${option} and return only one sentence which best describes the given sentence in that tone without changing its meaning: "${text}" ` }]
        };
        break;
      case 'translate':
        payload = {
        //   model: 'llama-3.3-70b-versatile',
        //   messages: [{ role: 'user', content: `Translate to ${option}: "${text}"` }]
        };
        break;
      case 'summarize':
        payload = {
        //   model: 'llama-3.3-70b-versatile',
        //   messages: [{ role: 'user', content: `Summarize: "${text}"` }]
        };
        break;
    }
    setAiEnhancementCounter((prev) => prev + 1);
    composer.clear();
        
    try {
      const res = await fetch('api/enhance', {
        method: 'POST',
        headers: {
			'Content-Type': 'application/json',
		},
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      composer.clear();
      // composer.insertText(data.choices[0].message.content);
      composer.insertText('This is AI Enhanced Text' + aiEnahcementCounter); 
    } catch (err) {
      console.error(err);
      composer.clear();
      composer.insertText(text);
    } 
    finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Render loading indicator as an overlay if tone, translation, or summarization is loading */}
				{(Loading ) && (
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

      {/* Dropdown menus for tone and translate */}
      <EnhancementToolbarDropdown
        type='tone'
        options={toneOptions.map((o) => ({ id: o, label: o }))}
        onSelect={(opt) => handleEnhancement('tone', opt)}
        disabled={disabled}
      />

      <EnhancementToolbarDropdown
        type='translate'
        options={translationOptions.map((o) => ({ id: o, label: o }))}
        onSelect={(opt) => handleEnhancement('translate', opt)}
        disabled={disabled}
      />
    </>
  );
};

export default memo(MessageBoxEnhancementToolbar);

