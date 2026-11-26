import { createContext, useContext, useState, type ReactNode } from 'react';
import { Linking, Text, type TextStyle } from 'react-native';
import type * as MessageParser from '@rocket.chat/message-parser';

import { Emoji } from './Emoji';
import { body, colors, mono } from './theme';

export type MentionTarget = { kind: 'user' | 'channel'; name: string };

type MarkupEnv = {
	onMention?: (target: MentionTarget) => void;
	mentions?: ReadonlyArray<{ username?: string }>;
	channels?: ReadonlyArray<{ name?: string }>;
};

export const MarkupEnvContext = createContext<MarkupEnv>({});

export const unsupported = (what: string) => (__DEV__ ? `[${what}: not supported yet] ` : '');

const dangerous = /^\s*(javascript|data|vbscript):/i;

function Spoiler({ children }: { children: ReactNode }) {
	const [shown, setShown] = useState(false);
	return (
		<Text onPress={() => setShown((s) => !s)} style={shown ? { backgroundColor: colors.codeBg } : { color: 'transparent', backgroundColor: colors.quoteBar }}>
			{children}
		</Text>
	);
}

function Mention({ kind, name }: MentionTarget) {
	const { onMention, mentions, channels } = useContext(MarkupEnvContext);
	const symbol = kind === 'user' ? '@' : '#';
	const special = kind === 'user' && (name === 'all' || name === 'here');
	// Like the web, only resolved mentions are highlighted; without the lists nothing can be resolved, so all are
	const resolved = kind === 'user' ? !mentions || mentions.some((m) => m.username === name) : !channels || channels.some((c) => c.name === name);
	if (!resolved && !special) return <Text>{symbol + name}</Text>;
	return (
		<Text
			onPress={special || !onMention ? undefined : () => onMention({ kind, name })}
			style={{ color: special ? '#9f2222' : colors.mention, backgroundColor: special ? '#fdecec' : colors.mentionBg }}
		>
			{symbol + name}
		</Text>
	);
}

const formats = {
	t: { timeStyle: 'short' },
	T: { timeStyle: 'medium' },
	d: { dateStyle: 'short' },
	D: { dateStyle: 'long' },
	f: { dateStyle: 'long', timeStyle: 'short' },
	F: { dateStyle: 'full', timeStyle: 'short' },
	R: { dateStyle: 'medium', timeStyle: 'short' },
} as const;

const timestampText = ({ timestamp, format }: MessageParser.Timestamp['value']) => {
	const date = new Date(Number(timestamp) * 1000);
	return Number.isNaN(date.getTime()) ? timestamp : new Intl.DateTimeFormat(undefined, formats[format] ?? formats.f).format(date);
};

const link = (src: string, children: ReactNode, key: number) => (
	<Text
		key={key}
		onPress={dangerous.test(src) ? undefined : () => Linking.openURL(src).catch(() => undefined)}
		style={{ color: colors.link, textDecorationLine: 'underline' }}
	>
		{children}
	</Text>
);

const styled = (key: number, style: TextStyle, children: ReactNode) => (
	<Text key={key} style={style}>
		{children}
	</Text>
);

// Unknown nodes render their text children or nothing, never throw
export function renderInlines(nodes: ReadonlyArray<MessageParser.Inlines | MessageParser.Markup> | undefined): ReactNode[] {
	if (!Array.isArray(nodes)) return [];
	return nodes.map((node, i): ReactNode => {
		switch (node.type) {
			case 'PLAIN_TEXT':
				return node.value;
			case 'BOLD':
				return styled(i, { fontWeight: '700' }, renderInlines(node.value));
			case 'ITALIC':
				return styled(i, { fontStyle: 'italic' }, renderInlines(node.value));
			case 'STRIKE':
				return styled(i, { textDecorationLine: 'line-through' }, renderInlines(node.value));
			case 'INLINE_CODE':
				return styled(i, { fontFamily: mono, fontSize: (body.fontSize ?? 14) - 1, backgroundColor: colors.codeBg }, node.value.value);
			case 'LINK':
				return link(node.value.src.value, renderInlines(Array.isArray(node.value.label) ? node.value.label : [node.value.label]), i);
			case 'IMAGE':
				return link(node.value.src.value, renderInlines([node.value.label]), i);
			case 'MENTION_USER':
				return <Mention key={i} kind='user' name={node.value.value} />;
			case 'MENTION_CHANNEL':
				return <Mention key={i} kind='channel' name={node.value.value} />;
			case 'EMOJI':
				return <Emoji key={i} emoji={node} />;
			case 'SPOILER':
				return <Spoiler key={i}>{renderInlines(node.value)}</Spoiler>;
			case 'COLOR': {
				const { r, g, b, a } = node.value;
				const css = `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(2)})`;
				return (
					<Text key={i}>
						<Text style={{ color: css }}>{'■ '}</Text>
						{css}
					</Text>
				);
			}
			case 'TIMESTAMP':
				return <Text key={i}>{timestampText(node.value)}</Text>;
			case 'INLINE_KATEX':
				return styled(i, { fontFamily: mono }, unsupported('katex') + node.value);
			default: {
				const { value } = node as { value?: unknown };
				return Array.isArray(value) ? <Text key={i}>{renderInlines(value)}</Text> : typeof value === 'string' ? value : null;
			}
		}
	});
}
