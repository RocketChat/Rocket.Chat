import { useSyncExternalStore } from 'react';
import { Text, type LayoutChangeEvent } from 'react-native';

// EXPO_PUBLIC_LAYOUT_DEBUG=1 prints the measured size of the tagged views on screen; names and ids are never recorded
export const layoutDebug = process.env.EXPO_PUBLIC_LAYOUT_DEBUG === '1';

const lines = new Map<string, string>();
const counts = new Map<string, number>();
const listeners = new Set<() => void>();
let snapshot = '';

const publish = (label: string, text: string) => {
	lines.set(label, text);
	snapshot = [...lines].map(([k, v]) => `${k} ${v}`).join('\n');
	listeners.forEach((l) => l());
};

export const measure = (label: string) =>
	layoutDebug
		? ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
				const n = (counts.get(label) ?? 0) + 1;
				counts.set(label, n);
				publish(label, `${Math.round(layout.width)}x${Math.round(layout.height)} (${n})`);
			}
		: undefined;

// Free-form facts such as the opening tag of a server avatar; callers pass only generic markup, never names or ids
export const note = (label: string, text: string) => {
	if (layoutDebug) publish(label, text);
};

const subscribe = (l: () => void) => {
	listeners.add(l);
	return () => void listeners.delete(l);
};

export function LayoutOverlay() {
	const text = useSyncExternalStore(subscribe, () => snapshot);
	if (!layoutDebug) return null;
	return (
		<Text pointerEvents='none' style={{ position: 'absolute', left: 4, bottom: 4, right: 4, fontSize: 9, backgroundColor: '#ffffffdd', color: '#000' }}>
			{text}
		</Text>
	);
}
