import { Modal, Box } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../../../../contexts/TranslationContext';

const FederationModal = ({ onClose, ...props }) => {
	const t = useTranslation();

	return (
		<Modal {...props}>
			<Modal.Header>
				<Modal.Title>{t('Federation')}</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<Box withRichContent>
					<p>{t('Cloud_register_offline_finish_helper')}</p>
				</Box>
				{/* <Box*/}
				{/*    display='flex'*/}
				{/*    flexDirection='column'*/}
				{/*    alignItems='stretch'*/}
				{/*    paddingInline='x16'*/}
				{/*    pb='x8'*/}
				{/*    flexGrow={1}*/}
				{/*    backgroundColor='neutral-800'*/}
				{/*    mb={status === 'invalid' && 'x8'}*/}
				{/* >*/}
				{/*    <Margins block='x8'>*/}
				{/*        <Scrollable vertical>*/}
				{/*            <Box*/}
				{/*                is='textarea'*/}
				{/*                height='x108'*/}
				{/*                fontFamily='mono'*/}
				{/*                fontScale='p1'*/}
				{/*                color='alternative'*/}
				{/*                style={{ wordBreak: 'break-all', resize: 'none' }}*/}
				{/*                placeholder={t('Paste_here')}*/}
				{/*                disabled={isUpdating}*/}
				{/*                value={newLicense}*/}
				{/*                autoComplete='off'*/}
				{/*                autoCorrect='off'*/}
				{/*                autoCapitalize='off'*/}
				{/*                spellCheck='false'*/}
				{/*                onChange={handleNewLicense}*/}
				{/*            />*/}
				{/*        </Scrollable>*/}
				{/*        <ButtonGroup align='start'>*/}
				{/*            <Button primary small disabled={isUpdating} onClick={handlePaste}>*/}
				{/*                <Icon name='clipboard' />*/}
				{/*                {t('Paste')}*/}
				{/*            </Button>*/}
				{/*        </ButtonGroup>*/}
				{/*    </Margins>*/}
				{/* </Box>*/}
				{/* {status === 'invalid' && <Callout type='danger'>{t('Cloud_Invalid_license')}</Callout>}*/}
			</Modal.Content>
			<Modal.Footer>
				{/* <ButtonGroup align='end'>*/}
				{/*    <Button primary disabled={!hasChanges || isUpdating} onClick={handleApplyLicense}>*/}
				{/*        {t('Cloud_Apply_license')}*/}
				{/*    </Button>*/}
				{/* </ButtonGroup>*/}
			</Modal.Footer>
		</Modal>
	);
};

export default FederationModal;
