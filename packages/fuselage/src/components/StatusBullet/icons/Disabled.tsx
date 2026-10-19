import type { StatusBulletProps } from '../StatusBullet';
import { StatusBulletFrame } from '../StatusBulletFrame';

const Disabled = ({ size, className, ...props }: StatusBulletProps) => (
	<StatusBulletFrame
		status='disabled'
		small={size === 'small'}
		className={`rcx-status-bullet rcx-status-bullet--disabled ${className} ${size === 'small' ? 'rcx-status-bullet--small' : ''}`}
		render={<svg {...props} width='24' height='24' viewBox='0 0 24 24' aria-hidden='true' xmlns='http://www.w3.org/2000/svg' />}
	>
		<path
			fillRule='evenodd'
			clipRule='evenodd'
			d='M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24ZM13.3367 5.33333C13.3367 4.59695 12.7398 4 12.0034 4C11.267 4 10.67 4.59695 10.67 5.33333V14.6667C10.67 15.403 11.267 16 12.0034 16C12.7398 16 13.3367 15.403 13.3367 14.6667V5.33333ZM13.3367 18.6667C13.3367 17.9303 12.7398 17.3333 12.0034 17.3333C11.267 17.3333 10.67 17.9303 10.67 18.6667C10.67 19.403 11.267 20 12.0034 20C12.7398 20 13.3367 19.403 13.3367 18.6667Z'
		/>
	</StatusBulletFrame>
);

export default Disabled;
