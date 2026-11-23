import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { action } from 'storybook/actions';

import type { BackgroundEffect, BackgroundEffectSelection, BackgroundImage, BackgroundPreset } from '../devices/BackgroundEffectContext';
import { BackgroundEffectProvider, isSameEffect } from '../devices/BackgroundEffectContext';

const svg = (body: string) =>
	`data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 90">${body}</svg>`)}`;

export const fakePresets: BackgroundPreset[] = [
	{ id: 'plain-light', name: 'Plain light', url: svg('<rect width="160" height="90" fill="#E4E7EA"/>') },
	{ id: 'plain-dark', name: 'Plain dark', url: svg('<rect width="160" height="90" fill="#2F343D"/>') },
	{
		id: 'soft-gradient',
		name: 'Soft gradient',
		url: svg(
			'<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5B8DEF"/><stop offset="1" stop-color="#9B6DE0"/></linearGradient></defs><rect width="160" height="90" fill="url(#g)"/>',
		),
	},
];

export const fakeImages: BackgroundImage[] = [
	{
		id: 'beach',
		name: 'beach-holiday.jpg',
		url: svg(
			'<rect width="160" height="90" fill="#8FD3F4"/><circle cx="128" cy="22" r="10" fill="#FFE27A"/><rect y="58" width="160" height="32" fill="#F4D58D"/><path d="M0 58 Q40 50 80 58 T160 58 V64 H0Z" fill="#3FA7D6"/>',
		),
	},
	{
		id: 'forest',
		name: 'forest-cabin.png',
		url: svg(
			'<rect width="160" height="90" fill="#CFE8D5"/><path d="M10 80 L30 30 L50 80Z M50 80 L75 20 L100 80Z M100 80 L125 35 L150 80Z" fill="#2E6B3F"/><rect y="78" width="160" height="12" fill="#6B4F2A"/>',
		),
	},
];

const NONE: BackgroundEffect = { kind: 'none' };

export type BackgroundEffectFixture = Partial<Omit<BackgroundEffectSelection, 'select' | 'toggle' | 'addImage' | 'removeImage'>> & {
	/** What the quick toggle turns on. */
	lastEffect?: BackgroundEffect;
	applyMs?: number;
};

/**
 * A simulated background effect: a choice is "Starting…" for a moment, then applied. An `applying` given up front never
 * finishes.
 */
const FakeBackgroundEffectProvider = ({
	supported = true,
	effect: initialEffect = NONE,
	applying: heldApplying,
	presets = fakePresets,
	images: initialImages = [],
	imageLimit = 5,
	lastEffect = { kind: 'blur', level: 'medium' },
	applyMs = 1200,
	children,
}: BackgroundEffectFixture & { children: ReactNode }) => {
	const [effect, setEffect] = useState(initialEffect);
	const [applying, setApplying] = useState(heldApplying);
	const [images, setImages] = useState(initialImages);
	const history = useRef<BackgroundEffect[]>(initialEffect.kind === 'none' ? [lastEffect] : [initialEffect]);
	const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

	useEffect(() => () => clearTimeout(timer.current), []);

	const apply = useCallback(
		(next: BackgroundEffect) => {
			if (applying || isSameEffect(next, effect)) {
				return;
			}
			if (next.kind === 'none') {
				setEffect(next);
				return;
			}
			setApplying(next);
			timer.current = setTimeout(() => {
				setEffect(next);
				setApplying(undefined);
				history.current = [...history.current.filter((used) => !isSameEffect(used, next)), next];
			}, applyMs);
		},
		[applying, effect, applyMs],
	);

	const value = useMemo(
		(): BackgroundEffectSelection => ({
			supported,
			effect,
			applying,
			presets,
			images,
			imageLimit,
			select: (next) => {
				action('selectBackgroundEffect')(next);
				apply(next);
			},
			toggle: () => {
				action('toggleBackgroundEffect')();
				apply(effect.kind === 'none' ? (history.current.at(-1) ?? lastEffect) : NONE);
			},
			addImage: (file) => {
				action('addBackgroundImage')(file.name);
				const image = { id: `${Date.now()}`, name: file.name, url: URL.createObjectURL(file) };
				setImages((current) => [...current, image]);
				apply({ kind: 'image', id: image.id });
			},
			removeImage: (id) => {
				action('removeBackgroundImage')(id);
				const removed: BackgroundEffect = { kind: 'image', id };
				setImages((current) => current.filter((image) => image.id !== id));
				history.current = history.current.filter((used) => !isSameEffect(used, removed));
				if (isSameEffect(effect, removed)) {
					setEffect(history.current.at(-1) ?? NONE);
				}
			},
		}),
		[supported, effect, applying, presets, images, imageLimit, apply, lastEffect],
	);

	return <BackgroundEffectProvider value={value}>{children}</BackgroundEffectProvider>;
};

export { FakeBackgroundEffectProvider };
