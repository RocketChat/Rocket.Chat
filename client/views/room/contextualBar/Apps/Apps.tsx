import { ButtonGroup, Button, Box } from '@rocket.chat/fuselage';
import { UiKitComponent, UiKitModal, modalParser } from '@rocket.chat/fuselage-ui-kit';
import React from 'react';

import VerticalBar from '../../../../components/VerticalBar';

const Apps = ({
  view,
  handleSubmit,
  handleCancel,
  handleClose,
}) => (
	<>
		<VerticalBar.Header>
			{view.showIcon ? <VerticalBar.Icon name='keyboard' /> : null}
			<VerticalBar.Text>{'App bar'}</VerticalBar.Text>
			{handleClose && <VerticalBar.Close onClick={handleClose} />}
		</VerticalBar.Header>
		<VerticalBar.ScrollableContent>
			<Box is='form' method='post' action='#' onSubmit={handleSubmit}>
				<UiKitComponent render={UiKitModal} blocks={view.blocks} />
			</Box>
		</VerticalBar.ScrollableContent>
		<VerticalBar.Footer>
			<ButtonGroup align='end'>
				{view.close && <Button onClick={handleCancel}>{modalParser.text(view.close.text)}</Button>}
				{view.submit && (
					<Button primary onClick={handleSubmit}>
						{modalParser.text(view.submit.text)}
					</Button>
				)}
			</ButtonGroup>
		</VerticalBar.Footer>
	</>
);

export default Apps;
