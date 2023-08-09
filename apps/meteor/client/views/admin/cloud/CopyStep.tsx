import { Box, Button, Scrollable, Modal } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import Clipboard from 'clipboard';
import type { FC } from 'react';
import React, { useEffect, useState, useRef } from 'react';

import MarkdownText from '../../../components/MarkdownText';
import { CLOUD_CONSOLE_URL } from '../../../lib/constants';

type CopyStepProps = {
	onNextButtonClick: () => void;
};

const CopyStep: FC<CopyStepProps> = ({ onNextButtonClick }) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [clientKey, setClientKey] = useState('');

	const getWorkspaceRegisterData = useMethod('cloud:getWorkspaceRegisterData');

	useEffect(() => {
		const loadWorkspaceRegisterData = async (): Promise<void> => {
			const clientKey = await getWorkspaceRegisterData();
			setClientKey(clientKey);
		};

		loadWorkspaceRegisterData();
	}, [getWorkspaceRegisterData]);

	const copyRef = useRef<HTMLElement>(null);

	useEffect(() => {
		if (!copyRef.current) {
			return;
		}

		const clipboard = new Clipboard(copyRef.current);
		clipboard.on('success', () => {
			dispatchToastMessage({ type: 'success', message: t('Copied') });
		});

		return (): void => {
			clipboard.destroy();
		};
	}, [dispatchToastMessage, t]);

	return (
		<>
			<Modal.Content>
				<Box withRichContent>
					<p>{t('Cloud_register_offline_helper')}</p>
				</Box>
				<Box display='flex' flexDirection='column' alignItems='stretch' padding={16} flexGrow={1} backgroundColor='dark'>
					<Scrollable vertical>
						<Box height='x108' fontFamily='mono' fontScale='p2' color='white' style={{ wordBreak: 'break-all' }}>
							{clientKey}
						</Box>
					</Scrollable>
					<Button icon='copy' ref={copyRef} primary data-clipboard-text={clientKey} />
				</Box>
				<MarkdownText preserveHtml={true} content={t('Cloud_click_here', { CLOUD_CONSOLE_URL })} />
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button primary onClick={onNextButtonClick}>
						{t('Next')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</>
	);
};

export default CopyStep;
