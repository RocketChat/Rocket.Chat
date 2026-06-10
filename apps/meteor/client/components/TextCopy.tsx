import { Box, Button, Scrollable } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import useClipboardWithToast from '../hooks/useClipboardWithToast';

const defaultWrapperRenderer = (text: string) => (
	<Box fontFamily='mono' alignSelf='center' fontScale='p2' style={{ wordBreak: 'break-all' }} mie={4} flexGrow={1} maxHeight='x108'>
		{text}
	</Box>
);

type TextCopyProps = {
	text: string;
	wrapper?: (text: string) => ReactNode;
} & ComponentProps<typeof Box>;

const TextCopy = ({ text, wrapper = defaultWrapperRenderer, ...props }: TextCopyProps) => {
	const { t } = useTranslation();

	const { copy } = useClipboardWithToast(text);

	const handleClick = () => {
		copy();
	};

	return (
		<Box
			display='flex'
			flexDirection='row'
			justifyContent='stretch'
			alignItems='flex-start'
			flexGrow={1}
			pb={16}
			backgroundColor='surface'
			width='full'
			{...props}
		>
			<Scrollable vertical>{wrapper(text)}</Scrollable>
			<Button icon='copy' secondary square small flexShrink={0} onClick={handleClick} title={t('Copy')} />
		</Box>
	);
};

export default TextCopy;
