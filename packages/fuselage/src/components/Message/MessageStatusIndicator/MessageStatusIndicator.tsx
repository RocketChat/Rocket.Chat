import type { AllHTMLAttributes, RefAttributes } from 'react';

export type MessageStatusIndicatorProps = AllHTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>;

function MessageStatusIndicator(props: MessageStatusIndicatorProps) {
	return <div className='rcx-message-status-indicator' {...props} />;
}

export default MessageStatusIndicator;
