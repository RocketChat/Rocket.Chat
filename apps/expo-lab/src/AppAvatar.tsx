import { useEffect, useState, type ReactNode } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { Avatar } from '@rocket.chat/fuselage';

import { measure, note } from './layoutDebug';

const px = { x24: 24, x36: 36 } as const;

type Size = keyof typeof px;

// The letter of a default avatar sits in whitespace that SvgXml draws as an offset, so the markup is trimmed before drawing.
export const trimSvg = (xml: string) => xml.replace(/>\s+/g, '>').replace(/\s+</g, '<');

// Whatever intrinsic size or viewBox the server writes, the drawing scales from a viewBox to the slot: the size attributes are dropped
// and a missing viewBox is rebuilt from them (200 is what the server writes when it has none to give)
export const normalizeSvg = (xml: string) =>
	xml.replace(/<svg\b[^>]*>/i, (open) => {
		const attr = (name: string) => new RegExp(`\\s${name}="([^"]*)"`, 'i').exec(open)?.[1];
		const dimension = (name: string) => {
			const value = Number.parseFloat(attr(name) ?? '');
			return !attr(name)?.includes('%') && value > 0 ? value : 200;
		};
		const viewBox = attr('viewBox') ?? `0 0 ${dimension('width')} ${dimension('height')}`;
		return open
			.replace(/\s(width|height|viewBox)="[^"]*"/gi, '')
			.replace(/<svg\b/i, `<svg viewBox="${viewBox}"`);
	});

// REST rooms and message authors carry no avatarETag, so the content type of the avatar URL tells a default (SVG) from an upload.
const svgByUrl = new Map<string, Promise<string | undefined>>();
const loadSvg = (url: string) => {
	let known = svgByUrl.get(url);
	if (!known) {
		known = fetch(url)
			.then(async (r) => {
				const type = r.headers.get('content-type') ?? '';
				if (!type.includes('svg')) {
					note('avatar-other', `${r.status} ${type.slice(0, 40)}`);
					return undefined;
				}
				const xml = await r.text();
				note('avatar-svg', `${r.status} ${xml.match(/<svg\b[^>]*>/i)?.[0].slice(0, 120) ?? 'no <svg> tag'}`);
				return normalizeSvg(trimSvg(xml));
			})
			.catch(() => undefined);
		svgByUrl.set(url, known);
	}
	return known;
};

// The slot is the token size whatever is drawn inside: nothing drawn can grow the avatar or squeeze it in a row
function Slot({ size, rounded, children }: { size: Size; rounded: boolean; children: ReactNode }) {
	const side = px[size];
	const check = measure(`avatar-${size}`);
	const onLayout = (e: LayoutChangeEvent) => {
		check?.(e);
		if (__DEV__ && e.nativeEvent.layout.width > side + 2) console.warn(`AppAvatar drew ${Math.round(e.nativeEvent.layout.width)}pt in a ${side}pt slot`);
	};

	return (
		<View style={{ width: side, height: side, flexShrink: 0, overflow: 'hidden', borderRadius: rounded ? side / 2 : 4 }}>
			<View onLayout={onLayout} style={{ alignSelf: 'flex-start' }}>
				{children}
			</View>
		</View>
	);
}

type Props = { url: string; size?: Size; rounded?: boolean };

// Fuselage's Avatar draws a React Native Image, which cannot draw SVG; a default avatar is drawn by SvgXml in the same slot.
export function AppAvatar({ url, size = 'x36', rounded = false }: Props) {
	const local = url.startsWith('data:');
	const [state, setState] = useState<{ xml?: string; done: boolean }>({ done: false });

	useEffect(() => {
		if (local) return;
		let live = true;
		setState({ done: false });
		loadSvg(url).then((xml) => live && setState({ xml, done: true }));
		return () => {
			live = false;
		};
	}, [url, local]);

	if (local || (state.done && !state.xml)) {
		return (
			<Slot size={size} rounded={rounded}>
				<Avatar url={url} size={size} rounded={rounded} />
			</Slot>
		);
	}

	return <Slot size={size} rounded={rounded}>{state.xml && <SvgXml xml={state.xml} width={px[size]} height={px[size]} preserveAspectRatio='xMidYMid meet' />}</Slot>;
}

export function SvgAvatar({ xml, size = 'x36', rounded = false }: { xml: string; size?: Size; rounded?: boolean }) {
	return (
		<Slot size={size} rounded={rounded}>
			<SvgXml xml={normalizeSvg(xml)} width={px[size]} height={px[size]} preserveAspectRatio='xMidYMid meet' />
		</Slot>
	);
}
