import type { AllHTMLAttributes } from 'react';

const RoomComposer = ({ children, ...props }: AllHTMLAttributes<HTMLElement>) => {
	return (
		<footer className='rc-message-box footer' {...props}>
			{children}
		</footer>
	);
};

export default RoomComposer;
