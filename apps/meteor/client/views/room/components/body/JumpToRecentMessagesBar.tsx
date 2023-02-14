import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement, UIEvent } from 'react';
import React from 'react';

import { isTruthy } from '../../../../../lib/isTruthy';

type JumpToRecentMessagesBarProps = {
	visible: boolean;
	onClick: (event: UIEvent) => void;
};

const JumpToRecentMessagesBar = ({ visible, onClick }: JumpToRecentMessagesBarProps): ReactElement => {
	const t = useTranslation();

	return (
		<div className={[`jump-recent`, `background-component-color`, !visible && 'not'].filter(isTruthy).join(' ')}>
			<button type='button' onClick={onClick}>
				{t('Jump_to_recent_messages')} <i className='icon-level-down' />
			</button>
		</div>
	);
};

export default JumpToRecentMessagesBar;
