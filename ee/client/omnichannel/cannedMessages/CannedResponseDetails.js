import React from 'react';
import { Box, Margins, ButtonGroup, Button, Icon, ActionButton } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import VerticalBar from '../../../../client/components/VerticalBar';

const CannedResponseDetails = ({ shortcut, text, scope, onEdit, onReturn, onClose }) => {
	console.log();

	const t = useTranslation();
	return <VerticalBar>
		<VerticalBar.Header>
			<ActionButton tiny ghost mis='none' icon='arrow-back' onClick={onReturn} />
			<VerticalBar.Text>!{shortcut}</VerticalBar.Text>
			<VerticalBar.Close onClick={onClose} />
		</VerticalBar.Header>

		<VerticalBar.ScrollableContent>
			<Margins block='x4'>
				<span display='flex' flexDirection='column'>
					<Box fontScale='p2'>{t('Shortcut')}:</Box>
					<Box fontScale='p1'>!{shortcut}</Box>
				</span>

				<span>
					<Box fontScale='p2'>{t('Content')}:</Box>
					<Box mbe='x2'>{text}</Box>
				</span>

				<span>
					<Box fontScale='p2'>{t('Scope')}:</Box>
					<Box mbs='x2'>{scope}</Box>
				</span>
			</Margins>
		</VerticalBar.ScrollableContent>

		<VerticalBar.Footer>
			<ButtonGroup stretch>
				<Button onClick={onEdit}><Icon name='pencil' size='x16'/>{t('Edit')}</Button>
			</ButtonGroup>
		</VerticalBar.Footer>
	</VerticalBar>;
};

export default React.memo(CannedResponseDetails);
