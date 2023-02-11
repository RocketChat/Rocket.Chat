import { Box, Icon, Button, Scrollable } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactElement } from 'react';
import React, { useCallback } from 'react';

const defaultWrapperRenderer = (text: string): ReactElement => (
	<Box fontFamily='mono' alignSelf='center' fontScale='p2' style={{ wordBreak: 'break-all' }} mie='x4' flexGrow={1} maxHeight='x108'>
		{text}
	</Box>
);

type TextCopyProps = {
	text: string;
	wrapper?: (text: string) => ReactElement;
} & ComponentProps<typeof Box>;

const TextCopy = ({ text, wrapper = defaultWrapperRenderer, ...props }: TextCopyProps): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const onClick = useCallback(() => {
		try {
			navigator.clipboard.writeText(text);
			dispatchToastMessage({ type: 'success', message: t('Copied') });
		} catch (e) {
			dispatchToastMessage({ type: 'error', message: e });
		}
	}, [dispatchToastMessage, t, text]);

	return (
		<Box
			display='flex'
			flexDirection='row'
			justifyContent='stretch'
			alignItems='flex-start'
			flexGrow={1}
			padding='x16'
			backgroundColor='surface'
			width='full'
			{...props}
		>
			<Scrollable vertical>{wrapper(text)}</Scrollable>
			<Button secondary square small flexShrink={0} onClick={onClick} title={t('Copy')}>
				<Icon name='copy' size='x20' />
			</Button>
		</Box>
	);
};

export default TextCopy;
