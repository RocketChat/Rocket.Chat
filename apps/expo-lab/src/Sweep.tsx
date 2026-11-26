import { Component, useEffect, type ComponentRef, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { LogBox, Pressable, ScrollView, Text as RNText, View } from 'react-native';
import { useFonts } from 'expo-font';
import { TamaguiProvider } from 'tamagui';
import '@tamagui/core';
import * as Fuselage from '@rocket.chat/fuselage';

import { tamaguiConfig } from '../../../packages/fuselage/src/tamagui.config';
import { cases } from './sweepCases';

// Errors a boundary caught are still reported to LogBox, whose full-screen overlay would cover the sweep
LogBox.ignoreAllLogs();
Object.assign(LogBox, { addException: () => undefined });

const iconFont = { RocketChat: require('../../../packages/icons/dist/font/rocketchat.ttf') as number };

type Status = 'pending' | 'renders' | 'empty' | 'throws';
type Result = { name: string; status: Status; error?: string; size?: string; uncaught?: string; viaText?: boolean };

const exported = Fuselage as unknown as Record<string, unknown>;

const isComponent = (value: unknown): value is ComponentType<Record<string, unknown>> =>
	typeof value === 'function' || (typeof value === 'object' && value !== null && '$$typeof' in value);

const names = Object.keys(exported)
	.filter((key) => /^[A-Z]/.test(key))
	.sort();
const componentNames = names.filter((key) => isComponent(exported[key]));

const firstLine = (error: Error) => `${error.name}: ${error.message}`.split('\n')[0].slice(0, 220);

class Cell extends Component<{ onError: (error: string) => void; children: ReactNode }, { error?: string }> {
	state: { error?: string } = {};

	static getDerivedStateFromError(error: Error) {
		return { error: firstLine(error) };
	}

	componentDidCatch(error: Error) {
		this.props.onError(firstLine(error));
	}

	render() {
		if (this.state.error) return <RNText style={{ color: 'crimson', fontSize: 11 }}>{this.state.error}</RNText>;
		return this.props.children;
	}
}

const post = (body: unknown) => {
	const sink = process.env.EXPO_PUBLIC_SWEEP_SINK;
	if (!sink) return;
	fetch(sink, { method: 'POST', body: JSON.stringify(body) }).catch(() => undefined);
};

export function Sweep({ onBack }: { onBack: () => void }) {
	const [fontsReady] = useFonts(iconFont);
	const [results, setResults] = useState<Record<string, Result>>({});
	const [current, setCurrent] = useState(0);
	const [done, setDone] = useState(false);
	const [retried, setRetried] = useState<Set<string>>(new Set());
	const [only, setOnly] = useState<string[]>([]);
	const active = useRef('');
	const latest = useRef(results);
	latest.current = results;
	const scroller = useRef<ComponentRef<typeof ScrollView>>(null);

	useEffect(() => {
		// A boundary does not catch errors thrown from timers; attribute them to the cell being mounted
		const previousConsole = console.error;
		console.error = () => undefined;
		const errorUtils = (globalThis as unknown as { ErrorUtils?: { setGlobalHandler(handler: (error: Error) => void): void } }).ErrorUtils;
		errorUtils?.setGlobalHandler((error) => {
			const name = active.current;
			setResults((all) => ({ ...all, [name]: { ...(all[name] ?? { name, status: 'renders' }), uncaught: firstLine(error) } }));
		});
		post({ kind: 'names', names, componentNames });
		// Photographing a part of the list: the sink answers with the component names to show
		const sink = process.env.EXPO_PUBLIC_SWEEP_SINK;
		if (sink) {
			fetch(sink)
				.then((response) => response.text())
				.then((text) => setOnly(text.split(',').filter(Boolean)))
				.catch(() => undefined);
		}
		return () => {
			console.error = previousConsole;
		};
	}, []);

	useEffect(() => {
		if (!fontsReady) return;
		if (current >= componentNames.length) {
			setDone(true);
			return;
		}
		active.current = componentNames[current];
		const timer = setTimeout(() => setCurrent((n) => n + 1), 150);
		return () => clearTimeout(timer);
	}, [current, fontsReady]);

	useEffect(() => {
		if (!done) return;
		const report = setTimeout(() => post({ kind: 'results', results: componentNames.map((name) => latest.current[name] ?? { name, status: 'pending' }) }), 3000);
		let offset = 0;
		const timer = setInterval(() => {
			scroller.current?.scrollTo({ y: offset, animated: false });
			offset += 560;
		}, 4000);
		return () => {
			clearTimeout(report);
			clearInterval(timer);
		};
	}, [done]);

	if (!fontsReady) return null;

	const record = (result: Result) => setResults((all) => ({ ...all, [result.name]: { ...all[result.name], ...result } }));

	return (
		<TamaguiProvider config={tamaguiConfig as never} defaultTheme='light'>
			<View style={{ flex: 1, paddingTop: 64, paddingHorizontal: 16 }}>
				<Pressable onPress={onBack}>
					<RNText style={{ fontSize: 16, paddingBottom: 4 }}>{`< Back  sweep ${Math.min(current, componentNames.length)}/${componentNames.length}${done ? ' done' : ''}`}</RNText>
				</Pressable>
				<ScrollView ref={scroller} style={{ flex: 1 }} contentInsetAdjustmentBehavior='never'>
					{componentNames
						.slice(0, current + 1)
						.filter((name) => !only.length || only.includes(name))
						.map((name) => {
						const entry = cases[name];
						const Target = exported[name] as ComponentType<Record<string, unknown>>;
						const status = results[name];
						return (
							<View key={name} style={{ paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#ddd' }}>
								<RNText style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>
									{name}
									{status?.status ? ` | ${status.status}` : ''}
									{status?.size ? ` ${status.size}` : ''}
									{status?.uncaught ? ` | uncaught: ${status.uncaught}` : ''}
								</RNText>
								{entry?.context ? (
									<RNText style={{ fontSize: 11, color: '#a60' }}>{`needs context: ${entry.context}`}</RNText>
								) : (
									<Cell onError={(error) => record({ name, status: 'throws', error })}>
										<View
											style={{ alignItems: 'flex-start' }}
											onLayout={(event) => {
												const { width, height } = event.nativeEvent.layout;
												const empty = width < 1 || height < 1;
												// A container frame cannot draw a bare string natively: retry once with a Text child to tell that apart from a broken frame
												if (empty && !entry && !retried.has(name)) setRetried((all) => new Set(all).add(name));
												record({ name, status: empty ? 'empty' : 'renders', size: `${Math.round(width)}x${Math.round(height)}`, viaText: retried.has(name) });
											}}
										>
											{entry?.render ? (
												entry.render()
											) : (
												<Target {...(entry?.props ?? {})}>
													{entry && 'children' in entry ? entry.children : retried.has(name) ? <RNText>{name}</RNText> : name}
												</Target>
											)}
										</View>
									</Cell>
								)}
							</View>
						);
					})}
				</ScrollView>
			</View>
		</TamaguiProvider>
	);
}
