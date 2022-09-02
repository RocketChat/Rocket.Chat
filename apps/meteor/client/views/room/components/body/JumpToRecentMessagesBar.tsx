import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

type JumpToRecentMessagesBarProps = {
	visible: boolean;
	onClick: () => void;
};

const JumpToRecentMessagesBar = ({ visible, onClick }: JumpToRecentMessagesBarProps): ReactElement => {
	const t = useTranslation();

	return (
		<div className={`jump-recent background-component-color${visible ? '' : 'not'}`}>
			<button onClick={onClick}>
				{t('Jump_to_recent_messages')} <i className='icon-level-down' />
			</button>
		</div>
	);
};

export default JumpToRecentMessagesBar;
