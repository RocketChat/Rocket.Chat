import { memo, type ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';
import type * as MessageParser from '@rocket.chat/message-parser';

import { Emoji } from './Emoji';
import { MarkupEnvContext, renderInlines, unsupported, type MentionTarget } from './Inline';
import { body, colors, headingSize, mono } from './theme';

// Same shape as MessageMarkupProps of the message list, plus the native press callback
export type MarkupProps = {
	md: MessageParser.Root;
	msg?: string;
	mentions?: ReadonlyArray<{ username?: string }>;
	channels?: ReadonlyArray<{ name?: string }>;
	searchText?: string;
	onMention?: (target: MentionTarget) => void;
};

const gap = 4;

const P = ({ children }: { children: ReactNode }) => <Text style={body}>{children}</Text>;

function CodeBlock({ lines }: { lines: MessageParser.CodeLine[] }) {
	return (
		<View style={{ backgroundColor: colors.codeBg, borderColor: colors.codeBorder, borderWidth: 1, borderRadius: 4 }}>
			<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 8 }}>
				<Text style={{ fontFamily: mono, fontSize: 12, lineHeight: 18, color: body.color }}>{lines.map((l) => l.value.value).join('\n')}</Text>
			</ScrollView>
		</View>
	);
}

type ListEntry = MessageParser.ListItem | MessageParser.Task;

function List({ kind, items }: { kind: 'ordered' | 'unordered' | 'tasks'; items: ReadonlyArray<ListEntry> }) {
	return (
		<View style={{ gap: 2 }}>
			{items.map((item, i) => {
				const marker = kind === 'tasks' ? ('status' in item && item.status ? '☑' : '☐') : kind === 'ordered' ? `${('number' in item && item.number) || i + 1}.` : '•';
				return (
					<View key={i}>
						<View style={{ flexDirection: 'row' }}>
							<Text style={[body, { width: kind === 'ordered' ? 28 : 20 }]}>{marker}</Text>
							<Text style={[body, { flex: 1 }]}>{renderInlines(item.value)}</Text>
						</View>
						{item.nested?.length ? (
							<View style={{ paddingLeft: 20 }}>
								{item.nested.map((n, j) => (
									<NestedList key={j} list={n} />
								))}
							</View>
						) : null}
					</View>
				);
			})}
		</View>
	);
}

function NestedList({ list }: { list: MessageParser.NestedList }) {
	if (list.type === 'ORDERED_LIST') return <List kind='ordered' items={list.value} />;
	if (list.type === 'UNORDERED_LIST') return <List kind='unordered' items={list.value} />;
	return <List kind='tasks' items={list.value} />;
}

// Tables and katex degrade to readable text; the marker shows in dev only
function Table({ table }: { table: MessageParser.Table['value'] }) {
	const row = (cells: MessageParser.TableCell[]) => cells.map((c) => c.value.map((n) => ('value' in n && typeof n.value === 'string' ? n.value : '')).join('')).join(' | ');
	return (
		<Text style={[body, { fontFamily: mono, fontSize: 12 }]}>
			{unsupported('table')}
			{[row(table.header), ...table.rows.map((r) => row(r.value))].join('\n')}
		</Text>
	);
}

function Block({ block, msg }: { block: MessageParser.Root[number]; msg?: string }) {
	switch (block.type) {
		case 'BIG_EMOJI':
			return (
				<View style={{ flexDirection: 'row' }}>
					{block.value.map((e, i) => (
						<Emoji key={i} emoji={e} big />
					))}
				</View>
			);
		case 'PARAGRAPH':
			return <P>{renderInlines(block.value)}</P>;
		case 'HEADING':
			return <Text style={[body, { fontSize: headingSize[block.level] ?? 16, lineHeight: (headingSize[block.level] ?? 16) * 1.25, fontWeight: '700' }]}>{renderInlines(block.value)}</Text>;
		case 'UNORDERED_LIST':
			return <List kind='unordered' items={block.value} />;
		case 'ORDERED_LIST':
			return <List kind='ordered' items={block.value} />;
		case 'TASKS':
			return <List kind='tasks' items={block.value} />;
		case 'QUOTE':
			return (
				<View style={{ borderLeftWidth: 3, borderLeftColor: colors.quoteBar, paddingLeft: 8, gap }}>
					{block.value.map((p, i) => (
						<P key={i}>{renderInlines(p.value)}</P>
					))}
				</View>
			);
		case 'SPOILER_BLOCK':
			return (
				<View style={{ gap }}>
					{block.value.map((p, i) => (
						<P key={i}>{renderInlines([{ type: 'SPOILER', value: p.value as MessageParser.Spoiler['value'] }])}</P>
					))}
				</View>
			);
		case 'CODE':
			return <CodeBlock lines={block.value} />;
		case 'KATEX':
			return (
				<Text style={[body, { fontFamily: mono, fontSize: 12 }]}>
					{unsupported('katex')}
					{block.value}
				</Text>
			);
		case 'TABLE':
			return <Table table={block.value} />;
		case 'LINE_BREAK':
			return <View style={{ height: body.lineHeight }} />;
		case 'HORIZONTAL_RULE':
			return <View style={{ height: 1, backgroundColor: colors.codeBorder, marginVertical: 4 }} />;
		default: {
			// A block without a renderer may carry a [start, end] span into the source, as on the web
			const { fallback, value } = block as { fallback?: unknown; value?: unknown };
			if (Array.isArray(fallback) && msg !== undefined) return <P>{msg.slice(fallback[0], fallback[1])}</P>;
			return Array.isArray(value) ? <P>{renderInlines(value)}</P> : null;
		}
	}
}

function Markup({ md, msg, mentions, channels, onMention }: MarkupProps) {
	if (!Array.isArray(md)) return null;
	return (
		<MarkupEnvContext.Provider value={{ onMention, mentions, channels }}>
			<View style={{ gap }}>
				{md.map((block, i) => (
					<Block key={i} block={block} msg={msg} />
				))}
			</View>
		</MarkupEnvContext.Provider>
	);
}

export default memo(Markup);
