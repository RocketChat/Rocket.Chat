import { useEffect, useRef, useState } from 'react';
import { ScrollView, Text } from 'react-native';

import { firstLine } from './ErrorCell';
import { SweepRow } from './SweepRow';
import { cases } from './sweepCases';
import { components, contextResults, total } from './sweepComponents';
import { sendReport, type Result } from './sweepReport';

export function SweepList() {
	const [results, setResults] = useState<Record<string, Result>>(() => Object.fromEntries(contextResults.map((r) => [r.name, r])));
	const [mounted, setMounted] = useState(0);
	const done = mounted >= total;
	const active = useRef('');

	useEffect(() => {
		// A boundary does not catch errors thrown from timers; attribute them to the cell being mounted
		const previousConsole = console.error;
		console.error = () => undefined;
		ErrorUtils.setGlobalHandler((error) => {
			const name = active.current;
			setResults((all) => ({ ...all, [name]: { ...(all[name] ?? { name, status: 'renders' }), uncaught: firstLine(error) } }));
		});
		return () => {
			console.error = previousConsole;
		};
	}, []);

	useEffect(() => {
		if (done) return;
		active.current = components[mounted].name;
		const timer = setTimeout(() => setMounted((n) => n + 1), 150);
		return () => clearTimeout(timer);
	}, [mounted, done]);

	// Late layouts and timer errors keep resetting the wait; the report goes out once the results stop changing
	useEffect(() => {
		if (!done) return;
		const timer = setTimeout(() => sendReport(components.map(({ name }) => results[name] ?? { name, status: 'pending' })), 3000);
		return () => clearTimeout(timer);
	}, [done, results]);

	const record = (result: Result) => setResults((all) => ({ ...all, [result.name]: { ...all[result.name], ...result } }));

	return (
		<>
			<Text style={{ fontSize: 11 }}>{`sweep ${Math.min(mounted, total)}/${total}${done ? ' done' : ''}`}</Text>
			<ScrollView style={{ flex: 1 }} contentInsetAdjustmentBehavior='never'>
				{components.slice(0, mounted + 1).map(({ name, Target }) => (
					<SweepRow key={name} name={name} Target={Target} entry={cases[name]} result={results[name]} onResult={record} />
				))}
			</ScrollView>
		</>
	);
}
