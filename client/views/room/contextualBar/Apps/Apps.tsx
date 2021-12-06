import { ButtonGroup, Button, Box } from '@rocket.chat/fuselage';
import { UiKitComponent, UiKitModal, modalParser } from '@rocket.chat/fuselage-ui-kit';
import React from 'react';

import VerticalBar from '../../../../components/VerticalBar';

const Apps = ({ view, onSubmit, onClose }) => (
	<>
		<VerticalBar.Header>
			{view.showIcon ? <VerticalBar.Icon name='keyboard' /> : null}
			<VerticalBar.Text>{'App bar'}</VerticalBar.Text>
			{onClose && <VerticalBar.Close onClick={onClose} />}
		</VerticalBar.Header>
		<VerticalBar.ScrollableContent>
			<Box is='form' method='post' action='#' onSubmit={onSubmit}>
				<UiKitComponent render={UiKitModal} blocks={view.blocks} />
			</Box>
		</VerticalBar.ScrollableContent>
		<VerticalBar.Footer>
			<ButtonGroup align='end'>
				{view.submit && (
					<Button primary onClick={onSubmit}>
						{modalParser.text(view.submit.text)}
					</Button>
				)}
			</ButtonGroup>
		</VerticalBar.Footer>
	</>
);

export default Apps;
