import { IUIKitSurface } from '@rocket.chat/apps-engine/definition/uikit';
import { ButtonGroup, Button, Box, Avatar } from '@rocket.chat/fuselage';
import { UiKitComponent, UiKitModal, modalParser } from '@rocket.chat/fuselage-ui-kit';
import React, { MouseEventHandler } from 'react';

import { getURL } from '../../../../../app/utils/lib/getURL';
import VerticalBar from '../../../../components/VerticalBar';

type AppsProps = {
	view: IUIKitSurface;
	onSubmit: () => void;
	onClose: MouseEventHandler<HTMLOrSVGElement>;
	appName: string;
	appId: string;
};

const Apps = ({ view, onSubmit, onClose, appName, appId }: AppsProps): JSX.Element => (
	<>
		<VerticalBar.Header>
			<Avatar url={getURL(`/api/apps/${appId}/icon`)} />
			<VerticalBar.Text>{appName}</VerticalBar.Text>
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
