import type { StatusBulletProps } from '../StatusBullet';
import { StatusBulletFrame } from '../StatusBulletFrame';

const Online = ({ size, className, ...props }: StatusBulletProps) => (
	<StatusBulletFrame
		status='online'
		small={size === 'small'}
		className={`rcx-status-bullet rcx-status-bullet--online ${className} ${size === 'small' ? 'rcx-status-bullet--small' : ''}`}
		render={<svg {...props} width='24' height='24' viewBox='0 0 24 24' aria-hidden='true' xmlns='http://www.w3.org/2000/svg' />}
	>
		<path d='M24 12.0001C24 18.6275 18.6274 24.0001 12 24.0001C5.37255 24.0001 -3.05176e-05 18.6275 -3.05176e-05 12.0001C-3.05176e-05 5.37271 5.37255 0.00012207 12 0.00012207C18.6274 0.00012207 24 5.37271 24 12.0001Z' />
	</StatusBulletFrame>
);

export default Online;
