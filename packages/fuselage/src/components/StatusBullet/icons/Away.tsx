import type { StatusBulletProps } from '../StatusBullet';
import { StatusBulletFrame } from '../StatusBulletFrame';

const Away = ({ size, className, ...props }: StatusBulletProps) => (
	<StatusBulletFrame
		status='away'
		small={size === 'small'}
		className={`rcx-status-bullet rcx-status-bullet--away ${className} ${size === 'small' ? 'rcx-status-bullet--small' : ''}`}
		render={<svg {...props} width='10' height='10' viewBox='0 0 10 10' aria-hidden='true' xmlns='http://www.w3.org/2000/svg' />}
	>
		<path
			fillRule='evenodd'
			clipRule='evenodd'
			d='M5.13337 9.93325C7.78434 9.93325 9.93338 7.78422 9.93338 5.13325C9.93338 2.48229 7.78434 0.333252 5.13337 0.333252C2.48241 0.333252 0.333374 2.48229 0.333374 5.13325C0.333374 7.78422 2.48241 9.93325 5.13337 9.93325ZM5.80004 2.33325C5.80004 1.96506 5.50156 1.66659 5.13337 1.66659C4.76518 1.66659 4.46671 1.96506 4.46671 2.33325V5.13325V5.45367L4.71691 5.65383L6.71691 7.25383C7.00442 7.48384 7.42395 7.43722 7.65395 7.14972C7.88396 6.86221 7.83735 6.44268 7.54984 6.21267L5.80004 4.81284V2.33325Z'
		/>
	</StatusBulletFrame>
);

export default Away;
