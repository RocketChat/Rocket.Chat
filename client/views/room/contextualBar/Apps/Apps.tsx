import { IUIKitSurface } from '@rocket.chat/apps-engine/definition/uikit';
import { ButtonGroup, Button, Box } from '@rocket.chat/fuselage';
import { UiKitComponent, UiKitModal, modalParser } from '@rocket.chat/fuselage-ui-kit';
import React from 'react';

import VerticalBar from '../../../../components/VerticalBar';

type AppsProps = {
	view: IUIKitSurface;
	onSubmit: () => void;
	onClose: () => void;
};

const Apps = ({ view, onSubmit, onClose }: AppsProps): JSX.Element => (
	<>
		<VerticalBar.Header>
			<VerticalBar.Icon name='cube' />
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
