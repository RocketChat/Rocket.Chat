import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { Avatar, AvatarContainer } from '@rocket.chat/fuselage';

const px = { x24: 24, x36: 36 } as const;

// REST rooms and message authors carry no avatarETag, so the content type of the avatar URL tells a default (SVG) from an upload.
const svgByUrl = new Map<string, Promise<boolean>>();
const isSvg = (url: string) => {
	let known = svgByUrl.get(url);
	if (!known) {
		known = fetch(url, { method: 'HEAD' })
			.then((r) => (r.headers.get('content-type') ?? '').includes('svg'))
			.catch(() => false);
		svgByUrl.set(url, known);
	}
	return known;
};

type Props = { url: string; size?: keyof typeof px; rounded?: boolean };

// Fuselage's Avatar draws a React Native Image, which cannot draw SVG; a default avatar is drawn by SvgUri in the same frame.
export function AppAvatar({ url, size = 'x36', rounded = false }: Props) {
	const local = url.startsWith('data:');
	const [svg, setSvg] = useState<boolean | undefined>(undefined);

	useEffect(() => {
		if (local) return;
		let live = true;
		setSvg(undefined);
		isSvg(url).then((value) => live && setSvg(value));
		return () => {
			live = false;
		};
	}, [url, local]);

	if (local || svg === false) return <Avatar url={url} size={size} rounded={rounded} />;

	return (
		<AvatarContainer size={size}>
			{svg && (
				<View style={{ width: '100%', height: '100%', overflow: 'hidden', borderRadius: rounded ? px[size] / 2 : 4 }}>
					<SvgUri uri={url} width='100%' height='100%' />
				</View>
			)}
		</AvatarContainer>
	);
}
