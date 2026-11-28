import { useState, type ComponentType, type ReactNode } from 'react';
import { Text, View, type LayoutChangeEvent } from 'react-native';

import { ErrorCell } from './ErrorCell';
import type { SweepCase } from './sweepCases';
import type { Result } from './sweepReport';

type Props = {
	name: string;
	Target: ComponentType<Record<string, unknown>>;
	entry?: SweepCase;
	result?: Result;
	onResult: (result: Result) => void;
};

const detail = ({ status, size, uncaught }: Result) => [status, size, uncaught && `uncaught: ${uncaught}`].filter(Boolean).join(' ');

export function SweepRow({ name, Target, entry, result, onResult }: Props) {
	const [viaText, setViaText] = useState(false);

	const children = (): ReactNode => {
		if (entry && 'children' in entry) return entry.children;
		return viaText ? <Text>{name}</Text> : name;
	};

	const onLayout = ({ nativeEvent }: LayoutChangeEvent) => {
		const { width, height } = nativeEvent.layout;
		const empty = width < 1 || height < 1;
		// A container frame cannot draw a bare string natively: retry once with a Text child to tell that apart from a broken frame
		if (empty && !entry && !viaText) setViaText(true);
		onResult({ name, status: empty ? 'empty' : 'renders', size: `${Math.round(width)}x${Math.round(height)}`, viaText });
	};

	return (
		<View style={{ paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#ddd' }}>
			<Text style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>{result ? `${name} | ${detail(result)}` : name}</Text>
			{entry?.context ? (
				<Text style={{ fontSize: 11, color: '#a60' }}>{`needs context: ${entry.context}`}</Text>
			) : (
				<ErrorCell onError={(error) => onResult({ name, status: 'throws', error })}>
					<View style={{ alignItems: 'flex-start' }} onLayout={onLayout}>
						{entry?.render ? entry.render() : <Target {...entry?.props}>{children()}</Target>}
					</View>
				</ErrorCell>
			)}
		</View>
	);
}
