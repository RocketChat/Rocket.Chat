import { Box, Modal } from '@rocket.chat/fuselage';
import type { ComponentProps, RefObject } from 'react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const iframeMsgListener =
	(iframeRef: RefObject<HTMLIFrameElement | null>, confirm: (data: any) => void, cancel: () => void) => (e: MessageEvent<any>) => {
		if (e.source !== iframeRef.current?.contentWindow) {
			return;
		}

		let data;
		try {
			data = JSON.parse(e.data);
		} catch (e) {
			return;
		}

		if (data.result) {
			confirm(data);
		} else {
			cancel();
		}
	};

export type IframeModalProps = {
	url: string;
	confirm: (data: any) => void;
	cancel: () => void;
	wrapperHeight?: string;
} & ComponentProps<typeof Modal>;

const IframeModal = ({ url, confirm, cancel, wrapperHeight = 'x360', ...props }: IframeModalProps) => {
	const { t } = useTranslation();
	const iframeRef = useRef<HTMLIFrameElement>(null);

	useEffect(() => {
		const listener = iframeMsgListener(iframeRef, confirm, cancel);

		window.addEventListener('message', listener);

		return () => {
			window.removeEventListener('message', listener);
		};
	}, [confirm, cancel]);

	return (
		<Modal height={wrapperHeight} {...props}>
			<Box padding='x12' width='full' height='full' flexGrow={1} backgroundColor='white' borderRadius='large'>
				<iframe ref={iframeRef} title={t('Marketplace_apps')} style={{ border: 'none', height: '100%', width: '100%' }} src={url} />
			</Box>
		</Modal>
	);
};

export default IframeModal;
