import { styled, Text } from '@tamagui/web';
import type { ReactNode } from 'react';

import { textIconColors } from '../../../Theme';
import { toCSSValue } from '../../../helpers/toCSSValue';
import { spacing } from '../../../styleTokens';
import { withFuselageProvider } from '../../FuselageProvider/FuselageProvider';
import { lineClamp, plainDiv, textScale, truncatedText } from '../messageStyles';

const MessageGenericPreviewDescriptionFrame = styled(Text, {
	...plainDiv,
	...textScale('c1'),
	marginBlockEnd: spacing('x4'),
	whiteSpace: 'normal',
	color: toCSSValue('--rcx-message-generic-preview-description-color', textIconColors['font-default']),

	variants: {
		truncated: {
			true: truncatedText,
		},
		clamp: {
			true: lineClamp(2),
		},
	} as const,
});

export type MessageGenericPreviewDescriptionProps = {
	children?: ReactNode;
	clamp?: boolean;
};

const MessageGenericPreviewDescription = ({ children, clamp = false }: MessageGenericPreviewDescriptionProps) => (
	<MessageGenericPreviewDescriptionFrame
		truncated={!clamp}
		clamp={clamp}
		className={['rcx-message-generic-preview__description', clamp && 'rcx-message-generic-preview__description--clamp']
			.filter(Boolean)
			.join(' ')}
	>
		{children}
	</MessageGenericPreviewDescriptionFrame>
);

export default withFuselageProvider(MessageGenericPreviewDescription);
