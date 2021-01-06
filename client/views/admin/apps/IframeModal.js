import { Box, Modal } from '@rocket.chat/fuselage';
import React, { useEffect } from 'react';

const iframeMsgListener = (cancel) => (e) => {
	let data;
	try {
		data = JSON.parse(e.data);
	} catch (e) {
		return;
	}

	cancel();
};

const IframeModal = ({ url, cancel, ...props }) => {
	useEffect(() => {
		const listener = iframeMsgListener(cancel);

		window.addEventListener('message', listener);

		return () => {
			window.removeEventListener('message', listener);
		};
	}, [cancel]);

	return <Modal height='x360' {...props}>
		<Box padding='x12' w='full' h='full' flexGrow={1}>
			<iframe style={{ border: 'none', height: '100%', width: '100%' }} src={url}/>
		</Box>
	</Modal>;
};

export default IframeModal;
