import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { Avatar, AvatarContainer } from '@rocket.chat/fuselage';

const px = { x24: 24, x36: 36 } as const;

// REST rooms and message authors carry no avatarETag, so the content type of the avatar URL tells a default (SVG) from an upload.
// The SVG source is kept: its letter sits in whitespace that SvgUri draws as an offset, so the markup is trimmed before drawing.
const svgByUrl = new Map<string, Promise<string | undefined>>();
const loadSvg = (url: string) => {
	let known = svgByUrl.get(url);
	if (!known) {
		known = fetch(url)
			.then((r) => ((r.headers.get('content-type') ?? '').includes('svg') ? r.text() : undefined))
			.then((xml) => xml?.replace(/>\s+/g, '>').replace(/\s+</g, '<'))
			.catch(() => undefined);
		svgByUrl.set(url, known);
	}
	return known;
};

type Props = { url: string; size?: keyof typeof px; rounded?: boolean };

// Fuselage's Avatar draws a React Native Image, which cannot draw SVG; a default avatar is drawn by SvgXml in the same frame.
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

	if (local || (state.done && !state.xml)) return <Avatar url={url} size={size} rounded={rounded} />;

	return (
		<AvatarContainer size={size}>
			{state.xml && (
				<View style={{ width: '100%', height: '100%', overflow: 'hidden', borderRadius: rounded ? px[size] / 2 : 4 }}>
					<SvgXml xml={state.xml} width='100%' height='100%' />
				</View>
			)}
		</AvatarContainer>
	);
}
