import { useEffect, useRef, useState, type ComponentRef, type ComponentType, type ReactNode } from 'react';
import {
	LogBox,
	Pressable,
	Platform,
	Text,
	TextInput,
	View,
	type LayoutChangeEvent,
	type NativeScrollEvent,
	type NativeSyntheticEvent,
	type TextInputContentSizeChangeEvent,
	type TextInputEndEditingEvent,
	type TextInputKeyPressEvent,
	type TextInputSelectionChangeEvent,
} from 'react-native';

import { insertText, replaceText, wrapSelection, type Edit, type Selection } from './composerLabOps';

LogBox.ignoreAllLogs();

type FuselageParts = { Provider: ComponentType<{ children: ReactNode }>; Area: ComponentType<Record<string, unknown>> };
type Config = { name: string; kind: 'raw' | 'fuselage'; selMode: 'ref' | 'prop' };
type Ev = { n: number; k: string; d?: unknown };
type Row = { config: string; id: string; expected: string; observed: string; verdict: 'pass' | 'fail' | 'info' };
type Instance = ComponentRef<typeof TextInput> | null;

const sink = process.env.EXPO_PUBLIC_COMPOSER_SINK ?? 'http://localhost:8787';
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const post = (path: string, body?: unknown) =>
	fetch(`${sink}${path}`, body === undefined ? undefined : { method: 'POST', body: JSON.stringify(body) }).catch(() => undefined);

const lines = (n: number) => Array.from({ length: n }, () => 'line').join('\n');
const codeUnits = (value: string) => Array.from(value, (c) => c.codePointAt(0)?.toString(16)).join(' ');

const fieldStyle = { minHeight: 52, maxHeight: 155, fontSize: 18, fontFamily: 'Menlo', borderWidth: 1, borderColor: '#888', padding: 8 } as const;
const emoji = 'a\u{1F600}b\u{1F469}‍\u{1F469}‍\u{1F467}c éx';

export function ComposerLab({ onBack, fuselage }: { onBack?: () => void; fuselage?: FuselageParts }) {
	const [text, setText] = useState('');
	const [sel, setSel] = useState<Selection>();
	const [selectOnFocus, setSelectOnFocus] = useState(false);
	const [cfg, setCfg] = useState<Config>({ name: 'raw-ref', kind: 'raw', selMode: 'ref' });
	const [caption, setCaption] = useState('starting');
	const [tail, setTail] = useState<string[]>([]);
	const [tally, setTally] = useState('');

	const input = useRef<Instance>(null);
	const events = useRef<Ev[]>([]);
	const seq = useRef(0);
	const waiters = useRef<{ k: string; resolve: (ev?: Ev) => void }[]>([]);
	const rows = useRef<Row[]>([]);
	const live = useRef(cfg);
	live.current = cfg;

	const ev = (k: string, d?: unknown) => {
		const entry = { n: ++seq.current, k, d };
		events.current.push(entry);
		setTail((t) => [...t.slice(-9), `${entry.n} ${k} ${d === undefined ? '' : JSON.stringify(d).slice(0, 60)}`]);
		waiters.current = waiters.current.filter((w) => {
			if (w.k !== k) return true;
			w.resolve(entry);
			return false;
		});
	};

	const handlers = {
		onSelectionChange: (e: TextInputSelectionChangeEvent) => ev('sel', e.nativeEvent.selection),
		onContentSizeChange: (e: TextInputContentSizeChangeEvent) => ev('size', { h: e.nativeEvent.contentSize.height }),
		onKeyPress: (e: TextInputKeyPressEvent) => ev('key', { key: e.nativeEvent.key }),
		onFocus: () => ev('focus'),
		onBlur: () => ev('blur'),
		onEndEditing: (e: TextInputEndEditingEvent) => ev('end', { text: e.nativeEvent.text }),
		onSubmitEditing: () => ev('submit'),
		onLayout: (e: LayoutChangeEvent) => ev('layout', { h: Math.round(e.nativeEvent.layout.height * 10) / 10 }),
		onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
			const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
			ev('scroll', { y: Math.round(contentOffset.y), ch: Math.round(contentSize.height), lh: Math.round(layoutMeasurement.height) });
		},
		onChangeText: (t: string) => ev('change', { len: t.length }),
		selectTextOnFocus: selectOnFocus,
		multiline: true,
		returnKeyType: 'default',
		enterKeyHint: 'send',
		autoCorrect: true,
		autoCapitalize: 'sentences',
		spellCheck: true,
		textContentType: 'none',
		autoComplete: 'off',
		cursorColor: 'crimson',
		style: fieldStyle,
	} as const;

	useEffect(() => {
		const wait = (k: string, ms = 1500) =>
			new Promise<Ev | undefined>((resolve) => {
				const timer = setTimeout(() => resolve(undefined), ms);
				waiters.current.push({
					k,
					resolve: (entry) => {
						clearTimeout(timer);
						resolve(entry);
					},
				});
			});

		const mark = () => seq.current;
		const since = (m: number, k?: string) => events.current.filter((e) => e.n > m && (!k || e.k === k));
		const last = (k: string) => events.current.findLast((e) => e.k === k)?.d as { h?: number; y?: number; ch?: number; lh?: number } | undefined;

		const rec = (id: string, expected: string, observed: string, verdict: Row['verdict']) => {
			rows.current.push({ config: live.current.name, id, expected, observed, verdict });
			setTally(`${rows.current.length} rows, ${rows.current.filter((r) => r.verdict === 'fail').length} fail`);
		};
		const eq = (id: string, expected: string, observed: string | undefined, label = '') =>
			rec(id, label || JSON.stringify(expected).slice(0, 70), JSON.stringify(observed)?.slice(0, 70) ?? 'undefined', observed === expected ? 'pass' : 'fail');

		const step = async (name: string) => {
			setCaption(`${live.current.name}: ${name}`);
			await sleep(120);
		};

		const focusField = async () => {
			if (input.current?.isFocused()) return;
			const focused = wait('focus');
			input.current?.focus();
			await focused;
			await sleep(150);
		};

		const probe = async () => {
			const m = mark();
			await focusField();
			input.current?.blur();
			await wait('end', 2500);
			const early = since(m, 'end');
			return (early.at(-1)?.d as { text?: string } | undefined)?.text;
		};

		const snap = async (name: string, allowed: string[] = ['raw-ref']) => {
			if (!allowed.includes(live.current.name)) return;
			await focusField();
			await sleep(350);
			await post(`/snap?name=${live.current.name}-${name}`);
		};

		const put = async (value: string, selection?: Selection, how: 'settled' | 'sameTick' | 'selectionFirst' = 'settled') => {
			const useProp = live.current.selMode === 'prop';
			if (how === 'selectionFirst' && selection) {
				if (useProp) setSel(selection);
				else input.current?.setSelection(selection.start, selection.end);
				await sleep(200);
				setText(value);
				await sleep(250);
				return;
			}
			setText(value);
			if (selection && useProp) setSel(selection);
			if (selection && !useProp) {
				if (how === 'settled') await sleep(200);
				input.current?.setSelection(selection.start, selection.end);
			}
			await sleep(250);
		};

		const caretLine = async (id: string, start: Edit | { text: string; selection: Selection }, op: (e: Edit) => Edit, expectText?: string) => {
			await put(start.text, start.selection);
			const edit = op(start);
			await put(edit.text, edit.selection);
			eq(id, expectText ?? edit.text, await probe(), `text ${JSON.stringify(expectText ?? edit.text).slice(0, 50)} selection ${edit.selection.start}..${edit.selection.end}`);
			return edit;
		};

		const suite = async () => {
			await step('1 controlled value');
			let m = mark();
			await put('hello');
			eq('1a set: native text', 'hello', await probe());
			rec('1a set: onChangeText fired', '0', String(since(m, 'change').length), since(m, 'change').length === 0 ? 'pass' : 'fail');
			rec('1a set: onSelectionChange fired', '0', String(since(m, 'sel').length), since(m, 'sel').length === 0 ? 'pass' : 'info');
			m = mark();
			await put('');
			eq('1b clear: native text', '', await probe());
			const long = 'lorem ipsum '.repeat(300);
			await put(long);
			const nativeLong = await probe();
			rec('1c long text (3600 chars): native equals state', 'equal', nativeLong === long ? 'equal' : `len ${nativeLong?.length}`, nativeLong === long ? 'pass' : 'fail');
			rec('1c long text: onChangeText fired', '0', String(since(m, 'change').length), since(m, 'change').length === 0 ? 'pass' : 'fail');
			setText('A');
			setText('AB');
			setText('ABC');
			await sleep(250);
			eq('1d three setState in one tick', 'ABC', await probe());
			m = mark();
			for (const t of ['one', 'two', 'three', 'four']) {
				setText(t);
				await sleep(0);
			}
			await sleep(300);
			eq('1d four setState a timer tick apart', 'four', await probe());
			rec('1d rapid sets: onChangeText fired', '0', String(since(m, 'change').length), since(m, 'change').length === 0 ? 'pass' : 'fail');
			const odd = 'a\r\nb\tc d​é';
			await put(odd);
			const nativeOdd = await probe();
			rec('1e CRLF, tab, NBSP, ZWSP, combining mark kept', codeUnits(odd), nativeOdd === odd ? 'identical' : codeUnits(nativeOdd ?? ''), nativeOdd === odd ? 'pass' : 'fail');
			await put(odd);
			rec('1f setText with the same value: onChangeText', '0', String(since(m, 'change').length), since(m, 'change').length === 0 ? 'pass' : 'fail');

			await step('2 selection');
			await put('hello world');
			m = mark();
			await put('hello world', { start: 6, end: 11 });
			const reported = since(m, 'sel').map((e) => e.d);
			rec(
				'2a programmatic selection 6..11: onSelectionChange',
				'{"start":6,"end":11}',
				reported.length ? JSON.stringify(reported) : 'not fired',
				reported.length ? 'pass' : 'fail',
			);
			await snap('sel-world', ['raw-ref', 'raw-prop', 'fuselage-ref']);

			await put('goodbye cruel world', { start: 8, end: 13 }, 'sameTick');
			await snap('sel-sametick', ['raw-ref', 'raw-prop']);
			await put('ab');
			await put('abcdefghij', { start: 5, end: 8 }, 'selectionFirst');
			await snap('sel-selection-first', ['raw-ref', 'raw-prop']);
			await put('hello world', { start: 6, end: 11 });
			await put('hello world!!!');
			await snap('sel-after-append', ['raw-ref', 'raw-prop']);

			await step('3 formatting');
			const base = { text: 'hello world', selection: { start: 6, end: 11 } };
			for (const [label, pattern] of [
				['bold *', '*{{text}}*'],
				['bold **', '**{{text}}**'],
				['italic _', '_{{text}}_'],
				['code `', '`{{text}}`'],
				['strike ~', '~{{text}}~'],
				['block ```', '```\n{{text}}\n```'],
			] as const) {
				await caretLine(`3 wrap ${label}, sel 6..11`, base, (e) => wrapSelection(e.text, e.selection, pattern));
			}
			const wrapped = await caretLine('3 wrap * then unwrap', base, (e) => wrapSelection(e.text, e.selection, '*{{text}}*'));
			await snap('wrap-bold');
			const unwrapped = wrapSelection(wrapped.text, wrapped.selection, '*{{text}}*');
			await put(unwrapped.text, unwrapped.selection);
			eq('3 second wrap toggles off', 'hello world', await probe());
			await caretLine('3 wrap * empty selection at 5', { text: 'hello world', selection: { start: 5, end: 5 } }, (e) => wrapSelection(e.text, e.selection, '*{{text}}*'));
			await snap('wrap-empty');
			const uni = { text: emoji, selection: { start: 1, end: 3 } };
			await put(uni.text, uni.selection);
			await snap('unicode-select-emoji');
			await put(uni.text, { start: 4, end: 12 });
			await snap('unicode-select-family');
			await put(uni.text, { start: 14, end: 16 });
			await snap('unicode-select-combining');
			await caretLine('3 wrap * around a surrogate pair (1..3)', uni, (e) => wrapSelection(e.text, e.selection, '*{{text}}*'));
			setSelectOnFocus(true);
			await sleep(200);
			await put(emoji);
			m = mark();
			input.current?.focus();
			const all = await wait('sel');
			input.current?.blur();
			setSelectOnFocus(false);
			const end = (all?.d as Selection | undefined)?.end;
			rec('3 native selection end is a UTF-16 offset', `${emoji.length} (code points ${Array.from(emoji).length})`, String(end), end === emoji.length ? 'pass' : 'fail');
			await sleep(200);

			await step('4 insert at caret');
			await caretLine('4 mention: replace typed @a with @ada', { text: 'hi @a', selection: { start: 5, end: 5 } }, (e) => replaceText(e.text, '@ada ', { start: 3, end: e.selection.start }));
			await snap('mention');
			await caretLine('4 emoji :smile: at caret 4', { text: 'say  now', selection: { start: 4, end: 4 } }, (e) => insertText(e.text, e.selection, ':smile:'));
			m = mark();
			await caretLine('4 newline at end', { text: 'line1', selection: { start: 5, end: 5 } }, (e) => insertText(e.text, e.selection, '\n'));
			await caretLine('4 insert over selection 6..11', base, (e) => insertText(e.text, e.selection, 'X'));

			await step('5 growth');
			const sizes: string[] = [];
			for (const n of [1, 3, 10, 40]) {
				await put(lines(n), { start: lines(n).length, end: lines(n).length });
				await sleep(300);
				sizes.push(`${n} lines: content ${last('size')?.h}, field ${last('layout')?.h}`);
			}
			await sleep(700);
			const sc = last('scroll');
			rec('5 40 lines, caret at end: scroll event', 'offset + field >= content - 12 (padding)', JSON.stringify(sc), sc && sc.y !== undefined && sc.lh !== undefined && sc.ch !== undefined && sc.y + sc.lh >= sc.ch - 12 ? 'pass' : 'fail');
			rec('5 content height from scroll events vs onContentSizeChange', 'equal', `scroll ch ${sc?.ch}, size ${last('size')?.h}`, sc?.ch === last('size')?.h ? 'pass' : 'fail');
			await snap('growth-40-end');
			m = mark();
			await put(lines(40), { start: 0, end: 0 });
			await sleep(700);
			const top = since(m, 'scroll').at(-1)?.d as { y?: number } | undefined;
			rec('5 40 lines, caret moved to start: scrolls to top', 'y 0', top ? `y ${top.y}` : 'no scroll event', top?.y === 0 ? 'pass' : 'info');
			await snap('growth-40-start');
			await put('');
			await sleep(300);
			sizes.push(`cleared: content ${last('size')?.h}, field ${last('layout')?.h}`);
			await put('x'.repeat(600));
			await sleep(400);
			sizes.push(`600 x unbroken: content ${last('size')?.h}, field ${last('layout')?.h}`);
			eq('5 600 unbroken chars: native text', 'x'.repeat(600), await probe(), '600 x');
			await snap('growth-unbroken');
			await put('word '.repeat(200));
			await sleep(300);
			sizes.push(`200 words: content ${last('size')?.h}, field ${last('layout')?.h}`);
			rec('5 heights', 'min 52, max 155 (web)', sizes.join(' | '), 'info');
			await put('');

			await step('7 event order');
			if (input.current?.isFocused()) input.current.blur();
			await sleep(500);
			m = mark();
			input.current?.focus();
			await sleep(400);
			input.current?.blur();
			await sleep(400);
			rec('7 focus() then blur(), event order', 'focus, end, blur', since(m).map((e) => e.k).join(', '), 'info');
		};

		const run = async () => {
			await post('/log', { start: Date.now(), platform: Platform.OS, version: Platform.Version });
			const configs: Config[] = [
				...(fuselage ? ([{ name: 'fuselage-ref', kind: 'fuselage', selMode: 'ref' }] as Config[]) : []),
				{ name: 'raw-prop', kind: 'raw', selMode: 'prop' },
				{ name: 'raw-ref', kind: 'raw', selMode: 'ref' },
			];
			for (const c of configs) {
				setText('');
				setSel(undefined);
				setCfg(c);
				await sleep(900);
				try {
					await suite();
				} catch (error) {
					rec('suite aborted', 'completes', String(error), 'fail');
				}
				await post('/result?name=partial', { rows: rows.current });
			}
			setCaption('done: type in the field to see events');
			await post('/result?name=results', {
				platform: Platform.OS,
				version: Platform.Version,
				fabric: Boolean((globalThis as { nativeFabricUIManager?: unknown }).nativeFabricUIManager),
				rows: rows.current,
				events: events.current.slice(0, 4000),
			});
		};

		run();
	}, []);

	const Area = fuselage?.Area;
	const field =
		cfg.kind === 'fuselage' && Area ? (
			<Area key={cfg.name} ref={input} value={text} onChange={(t: string) => ev('change', { len: t.length, viaOnChange: true })} {...handlers} onChangeText={undefined} />
		) : (
			<TextInput
				key={cfg.name}
				ref={input}
				value={text}
				selection={cfg.selMode === 'prop' ? sel : undefined}
				{...handlers}
			/>
		);

	const body = (
		<View style={{ flex: 1, paddingTop: 64, paddingHorizontal: 16, backgroundColor: 'white' }}>
			{onBack && (
				<Pressable onPress={onBack}>
					<Text style={{ fontSize: 16, paddingBottom: 8 }}>{'< Back'}</Text>
				</Pressable>
			)}
			{field}
			<Text style={{ fontSize: 12, marginTop: 8, fontWeight: '600' }}>{caption}</Text>
			<Text style={{ fontSize: 11 }}>{tally}</Text>
			<View style={{ marginTop: 8 }}>
				{tail.map((line, i) => (
					<Text key={i} style={{ fontFamily: 'Menlo', fontSize: 10 }} numberOfLines={1}>
						{line}
					</Text>
				))}
			</View>
		</View>
	);

	return fuselage ? <fuselage.Provider>{body}</fuselage.Provider> : body;
}
