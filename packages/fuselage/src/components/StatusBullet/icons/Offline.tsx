import type { StatusBulletProps } from '../StatusBullet';
import { StatusBulletFrame } from '../StatusBulletFrame';

const Offline = ({ size, className, ...props }: StatusBulletProps) => (
	<StatusBulletFrame
		status='offline'
		small={size === 'small'}
		className={`rcx-status-bullet rcx-status-bullet--offline ${className} ${size === 'small' ? 'rcx-status-bullet--small' : ''}`}
		render={<svg {...props} width='12' height='12' viewBox='0 0 12 12' fill='none' aria-hidden='true' xmlns='http://www.w3.org/2000/svg' />}
	>
		<circle cx='6' cy='6' r='5' className='rcx-status-bullet rcx-status-bullet--offline' strokeWidth='2' />
	</StatusBulletFrame>
);

export default Offline;
