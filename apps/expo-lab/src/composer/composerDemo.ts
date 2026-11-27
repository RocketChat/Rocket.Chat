import { useEffect } from 'react';

import type { NativeComposerAPI } from './createNativeComposerAPI.ts';

// Dev only: EXPO_PUBLIC_COMPOSER_DEMO=1 in mock mode drives the composer through the API so growth, clamp, selection and wrap can
// be seen without typing
export const composerDemo = process.env.EXPO_PUBLIC_COMPOSER_DEMO === '1';

const lines = Array.from({ length: 9 }, (_, i) => `Line ${i + 1} of a long message that keeps the field growing`).join('\n');

const steps: { label: string; run: (api: NativeComposerAPI) => void }[] = [
	{ label: 'short text', run: (api) => api.setText('Hello team, the build is green') },
	{ label: 'long multi-line text, grows to the clamp', run: (api) => api.setText(lines) },
	{ label: 'unbroken 600 characters', run: (api) => api.setText('x'.repeat(600)) },
	{
		label: 'select a word',
		run: (api) => {
			api.setText('Ship the release today');
			api.setSelection({ start: 9, end: 16 });
		},
	},
	{ label: 'wrap the selection in bold', run: (api) => api.wrapSelection('*{{text}}*') },
	{
		label: 'insert a mention',
		run: (api) => {
			api.setCursorToEnd();
			api.insertText(' @ada ');
		},
	},
	{ label: 'clear', run: (api) => api.clear() },
];

export function useComposerDemo(api: NativeComposerAPI, enabled: boolean, onStep: (label: string) => void, everyMs = 3500) {
	useEffect(() => {
		if (!enabled) return;
		let i = 0;
		const tick = () => {
			const step = steps[i % steps.length];
			api.focus();
			step.run(api);
			onStep(step.label);
			i += 1;
		};
		const first = setTimeout(tick, 1500);
		const timer = setInterval(tick, everyMs);
		return () => {
			clearTimeout(first);
			clearInterval(timer);
		};
	}, [api, enabled, onStep, everyMs]);
}
