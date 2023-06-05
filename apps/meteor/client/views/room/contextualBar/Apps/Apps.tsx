import type { IUIKitSurface } from '@rocket.chat/apps-engine/definition/uikit';
import { ButtonGroup, Button, Box, Avatar } from '@rocket.chat/fuselage';
import { UiKitComponent, UiKitModal, modalParser } from '@rocket.chat/fuselage-ui-kit';
import type { LayoutBlock } from '@rocket.chat/ui-kit';
import { BlockContext } from '@rocket.chat/ui-kit';
import React from 'react';

import { getURL } from '../../../../../app/utils/client/getURL';
import {
	ContextualbarHeader,
	ContextualbarTitle,
	ContextualbarScrollableContent,
	ContextualbarFooter,
	ContextualbarClose,
} from '../../../../components/Contextualbar';
import { getButtonStyle } from '../../../modal/uikit/getButtonStyle';

type AppsProps = {
	view: IUIKitSurface;
	onSubmit: (e: any) => void;
	onCancel: (e: any) => Promise<void>;
	onClose: (e: any) => Promise<void>;
	appId: string;
};

const Apps = ({ view, onSubmit, onClose, onCancel, appId }: AppsProps): JSX.Element => (
	<>
		<ContextualbarHeader>
			<Avatar url={getURL(`/api/apps/${appId}/icon`)} />
			<ContextualbarTitle>{modalParser.text(view.title, BlockContext.NONE, 0)}</ContextualbarTitle>
			{onClose && <ContextualbarClose onClick={onClose} />}
		</ContextualbarHeader>
		<ContextualbarScrollableContent>
			<Box is='form' method='post' action='#' onSubmit={onSubmit}>
				<UiKitComponent render={UiKitModal} blocks={view.blocks as LayoutBlock[]} />
			</Box>
		</ContextualbarScrollableContent>
		<ContextualbarFooter>
			<ButtonGroup align='end'>
				{view.close && (
					<Button danger={view.close.style === 'danger'} onClick={onCancel}>
						{modalParser.text(view.close.text, BlockContext.NONE, 0)}
					</Button>
				)}
				{view.submit && (
					<Button {...getButtonStyle(view)} onClick={onSubmit}>
						{modalParser.text(view.submit.text, BlockContext.NONE, 1)}
					</Button>
				)}
			</ButtonGroup>
		</ContextualbarFooter>
	</>
);

export default Apps;
