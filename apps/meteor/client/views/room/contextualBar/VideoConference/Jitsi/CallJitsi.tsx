import { ISetting } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, ReactNode, RefObject } from 'react';

import VerticalBar from '../../../../../components/VerticalBar';

type CallJitsiProps = {
	handleClose: () => void;
	openNewWindow: ISetting['value'];
	refContent: RefObject<HTMLDivElement>;
	children: ReactNode;
};

const CallJitsi = ({ handleClose, openNewWindow, refContent, children }: CallJitsiProps): ReactElement => {
	const t = useTranslation();

	const content = openNewWindow ? (
		<>
			<Box fontScale='p2m'>{t('Video_Conference')}</Box>
			<Box fontScale='p2' color='neutral-700'>
				{t('Opened_in_a_new_window')}
			</Box>
		</>
	) : (
		<div ref={refContent} />
	);

	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Icon name='phone' />
				<VerticalBar.Text>{t('Call')}</VerticalBar.Text>
				{handleClose && <VerticalBar.Close onClick={handleClose} />}
			</VerticalBar.Header>
			<VerticalBar.ScrollableContent>
				{content}
				{children}
			</VerticalBar.ScrollableContent>
		</>
	);
};

export default CallJitsi;
