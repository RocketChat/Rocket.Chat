import { Box, Button, Scrollable, Throbber, Modal } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import type { ChangeEvent, FC } from 'react';
import React, { useState } from 'react';

import { queryClient } from '../../../lib/queryClient';

type PasteStepProps = {
	onBackButtonClick: () => void;
	onFinish: () => void;
};

const PasteStep: FC<PasteStepProps> = ({ onBackButtonClick, onFinish }) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [isLoading, setLoading] = useState(false);
	const [cloudKey, setCloudKey] = useState('');

	const handleCloudKeyChange = (e: ChangeEvent<HTMLInputElement>): void => {
		setCloudKey(e.currentTarget.value);
	};

	const registerManually = useEndpoint('POST', '/v1/cloud.manualRegister');

	const handleFinishButtonClick = async (): Promise<void> => {
		setLoading(true);

		try {
			await registerManually({ cloudBlob: cloudKey });
			queryClient.invalidateQueries(['licenses']);
			dispatchToastMessage({ type: 'success', message: t('Cloud_register_success') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: t('Cloud_register_error') });
		} finally {
			setLoading(false);
			onFinish?.();
		}
	};

	return (
		<>
			<Modal.Content>
				<Box withRichContent>
					<p>{t('Cloud_register_offline_finish_helper')}</p>
				</Box>
				<Box display='flex' flexDirection='column' alignItems='stretch' padding={16} flexGrow={1} backgroundColor='dark'>
					<Scrollable vertical>
						<Box
							is='textarea'
							height='x108'
							fontFamily='mono'
							fontScale='p2'
							color='white'
							style={{ wordBreak: 'break-all', resize: 'none' }}
							placeholder={t('Paste_here')}
							disabled={isLoading}
							value={cloudKey}
							autoComplete='off'
							autoCorrect='off'
							autoCapitalize='off'
							spellCheck='false'
							onChange={handleCloudKeyChange}
						/>
					</Scrollable>
				</Box>
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button disabled={isLoading} onClick={onBackButtonClick}>
						{t('Back')}
					</Button>
					<Button primary disabled={isLoading || !cloudKey.trim()} marginInlineStart='auto' onClick={handleFinishButtonClick}>
						{isLoading ? <Throbber inheritColor /> : t('Finish_Registration')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</>
	);
};

export default PasteStep;
