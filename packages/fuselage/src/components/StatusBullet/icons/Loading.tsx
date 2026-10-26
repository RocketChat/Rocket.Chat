import { prependClassName } from '../../../helpers/prependClassName';
import type { StatusBulletProps } from '../StatusBullet';
import { StatusBulletFrame } from '../StatusBulletFrame';

const Loading = ({ size, className, ...props }: StatusBulletProps) => (
	<StatusBulletFrame
		status='loading'
		small={size === 'small'}
		className={prependClassName(
			className,
			`rcx-status-bullet rcx-status-bullet--loading${size === 'small' ? ' rcx-status-bullet--small' : ''}`,
		)}
		render={<svg {...props} width='12' height='12' viewBox='0 0 12 12' fill='none' aria-hidden='true' xmlns='http://www.w3.org/2000/svg' />}
	>
		<circle cx='6' cy='6' r='5' className='rcx-status-bullet rcx-status-bullet--loading' strokeWidth='2' strokeDasharray='2 2' />
	</StatusBulletFrame>
);

export default Loading;
