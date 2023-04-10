import { createClassName } from '../helpers';
import styles from './styles.scss';

type AvatarProps = {
	small?: boolean;
	large?: boolean;
	src?: string;
	description?: string;
	status?: 'online' | 'offline' | 'busy' | 'away';
	className?: string;
};

export const Avatar = ({ small, large, src, description, status, className }: AvatarProps) => {
	return (
		<div aria-label='User picture' className={createClassName(styles, 'avatar', { small, large, nobg: src }, [className])}>
			{src && <img src={src} alt={description} className={createClassName(styles, 'avatar__image')} />}
			{status && <span className={createClassName(styles, 'avatar__status', { small, large, status })} />}
		</div>
	);
};
