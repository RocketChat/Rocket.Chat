import { Box, Button, ButtonGroup, Scrollable, Throbber, Modal } from '@rocket.chat/fuselage';
import { useToastMessageDispatch, useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ChangeEvent, FC, useState } from 'react';

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

	const registerManually = useEndpoint('POST', 'cloud.manualRegister');

	const handleFinishButtonClick = async (): Promise<void> => {
		setLoading(true);

		try {
			await registerManually({ cloudBlob: cloudKey });
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
				<Box display='flex' flexDirection='column' alignItems='stretch' padding='x16' flexGrow={1} backgroundColor='neutral-800'>
					<Scrollable vertical>
						<Box
							is='textarea'
							height='x108'
							fontFamily='mono'
							fontScale='p2'
							color='alternative'
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
				<ButtonGroup>
					<Button disabled={isLoading} onClick={onBackButtonClick}>
						{t('Back')}
					</Button>
					<Button primary disabled={isLoading || !cloudKey.trim()} marginInlineStart='auto' onClick={handleFinishButtonClick}>
						{isLoading ? <Throbber inheritColor /> : t('Finish_Registration')}
					</Button>
				</ButtonGroup>
			</Modal.Footer>
		</>
	);
};

export default PasteStep;
