import { Box, Modal } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const iframeMsgListener = (confirm: (data: any) => void, cancel: () => void) => (e: MessageEvent<any>) => {
	let data;
	try {
		data = JSON.parse(e.data);
	} catch (e) {
		return;
	}

	data.result ? confirm(data) : cancel();
};

type IframeModalProps = {
	url: string;
	confirm: (data: any) => void;
	cancel: () => void;
	wrapperHeight?: string;
} & ComponentProps<typeof Modal>;

const IframeModal = ({ url, confirm, cancel, wrapperHeight = 'x360', ...props }: IframeModalProps) => {
	const { t } = useTranslation();

	useEffect(() => {
		const listener = iframeMsgListener(confirm, cancel);

		window.addEventListener('message', listener);

		return () => {
			window.removeEventListener('message', listener);
		};
	}, [confirm, cancel]);

	return (
		<Modal height={wrapperHeight} {...props}>
			<Box padding='x12' w='full' h='full' flexGrow={1} bg='white' borderRadius='x8'>
				<iframe title={t('Marketplace_apps')} style={{ border: 'none', height: '100%', width: '100%' }} src={url} />
			</Box>
		</Modal>
	);
};

export default IframeModal;
