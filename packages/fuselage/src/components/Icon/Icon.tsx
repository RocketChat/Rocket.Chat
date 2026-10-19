import type { Keys as IconName } from '@rocket.chat/icons';
import nameToCharacterMapping from '@rocket.chat/icons';
import { styled, Text, type GetProps } from '@tamagui/web';
import type { RefAttributes } from 'react';

import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import type { BoxProps } from '../Box';
import { useBoxTransform } from '../Box/BoxTransforms';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export const IconFrame = styled(Text, {
	render: 'i',
	display: 'inline-block',
	whiteSpace: 'inherit',
	wordWrap: 'inherit',
	userSelect: 'none',
	verticalAlign: 'text-bottom',
	letterSpacing: 0,
	fontFamily: 'RocketChat',
	fontSize: 'inherit',
	fontWeight: '400',
	fontStyle: 'normal',
	fontVariant: 'normal',
	lineHeight: '1',
	textRendering: 'auto',
});

export type IconProps = Omit<BoxProps, 'ref' | 'name' | 'size'> &
	RefAttributes<HTMLElement> & {
		name: IconName;
		size?: BoxProps['width'];
	};

function Icon({ name, size, ...props }: IconProps) {
	const transformFn = useBoxTransform();
	const boxProps = { 'rcx-icon': true, 'rcx-icon--name': name, 'fontSize': size, ...props };
	const frameProps = useTamaguiBoxProps(transformFn ? transformFn(boxProps) : boxProps);

	return (
		<IconFrame aria-hidden {...(frameProps as GetProps<typeof IconFrame>)}>
			{nameToCharacterMapping[name]}
		</IconFrame>
	);
}

export default withFuselageProvider(Icon);
