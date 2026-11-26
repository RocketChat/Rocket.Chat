import { createContext, useContext, useState } from 'react';
import { Image, Text } from 'react-native';
import type * as MessageParser from '@rocket.chat/message-parser';

import { body } from './theme';

// Base URL of the server whose custom emoji are served at /emoji-custom/<name>.png; unset in mock mode
export const EmojiServerContext = createContext<string | undefined>(undefined);

// No emoji pack on native yet: a few common names stand in for it. A real pack replaces resolveEmoji only
const common: Record<string, string> = {
	tada: '🎉',
	eyes: '👀',
	smile: '😄',
	slight_smile: '🙂',
	grinning: '😀',
	joy: '😂',
	heart: '❤️',
	'+1': '👍',
	thumbsup: '👍',
	'-1': '👎',
	rocket: '🚀',
	fire: '🔥',
	white_check_mark: '✅',
	warning: '⚠️',
	wave: '👋',
	pray: '🙏',
};

export type ResolvedEmoji = { kind: 'text'; text: string } | { kind: 'image'; uri: string };

export function resolveEmoji(shortCode: string, server?: string): ResolvedEmoji {
	const unicode = common[shortCode];
	if (unicode) return { kind: 'text', text: unicode };
	if (server) return { kind: 'image', uri: `${server}/emoji-custom/${encodeURIComponent(shortCode)}.png` };
	return { kind: 'text', text: `:${shortCode}:` };
}

const textSize = (big: boolean) => (big ? { fontSize: 36, lineHeight: 44 } : { fontSize: body.fontSize, lineHeight: body.lineHeight });

function CustomImage({ uri, fallback, big }: { uri: string; fallback: string; big: boolean }) {
	const [failed, setFailed] = useState(false);
	if (failed) return <Text style={textSize(big)}>{fallback}</Text>;
	const size = big ? 40 : 20;
	return <Image source={{ uri }} style={{ width: size, height: size }} onError={() => setFailed(true)} accessibilityLabel={fallback} />;
}

export function Emoji({ emoji, big = false }: { emoji: MessageParser.Emoji; big?: boolean }) {
	const server = useContext(EmojiServerContext);

	if (!('shortCode' in emoji)) return <Text style={textSize(big)}>{emoji.unicode}</Text>;

	// An ascii form such as :) keeps the typed text as value; a plain :name: keeps the name
	const ascii = emoji.value.value !== emoji.shortCode ? emoji.value.value : undefined;
	const resolved = resolveEmoji(emoji.shortCode, server);
	const fallback = ascii ?? `:${emoji.shortCode}:`;
	if (resolved.kind === 'image') return <CustomImage uri={resolved.uri} fallback={fallback} big={big} />;
	return <Text style={textSize(big)}>{resolved.text.startsWith(':') ? fallback : resolved.text}</Text>;
}

export type MessageEmojiProps = { emojiHandle: string; className?: string; fillContainer?: boolean };

// The shape MessageRenderersContext.Emoji takes: a handle such as :smile:, as in reactions
export function MessageEmoji({ emojiHandle }: MessageEmojiProps) {
	const shortCode = emojiHandle.replace(/^:|:$/g, '');
	return <Emoji emoji={{ type: 'EMOJI', value: { type: 'PLAIN_TEXT', value: shortCode }, shortCode }} />;
}
