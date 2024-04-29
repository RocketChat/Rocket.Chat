import { css } from '@rocket.chat/css-in-js';
import { HeaderContentRow, HeaderSection, HeaderSubtitle } from '@rocket.chat/ui-client';
import type { FC, MouseEvent } from 'react';
import React from 'react';

type AnnouncementComponentParams = {
	onClickOpen: (e: MouseEvent<HTMLAnchorElement>) => void;
};

const AnnouncementComponent: FC<AnnouncementComponentParams> = ({ children, onClickOpen }) => {
	const pointer = css`
		cursor: pointer;
	`;

	return (
		<>
			<HeaderSection className={['rcx-header-section', pointer]} onClick={onClickOpen}>
				<HeaderContentRow>
					<HeaderSubtitle is='h2' flexGrow={1} data-qa='AnnouncementAnnoucementComponent'>
						{children}
					</HeaderSubtitle>
				</HeaderContentRow>
			</HeaderSection>
		</>
	);
};

export default AnnouncementComponent;
