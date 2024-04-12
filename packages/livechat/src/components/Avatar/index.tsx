import { Component } from 'preact';
import type { CSSProperties } from 'preact/compat';

import { createClassName } from '../../helpers/createClassName';
import styles from './styles.scss';

type AvatarProps = {
	small?: boolean;
	large?: boolean;
	src?: string;
	description?: string;
	status?: string;
	className?: string;
	style?: CSSProperties;
};

type AvatarState = {
	errored: boolean;
};

export class Avatar extends Component<AvatarProps, AvatarState> {
	static getDerivedStateFromProps(props: AvatarProps) {
		if (props.src) {
			return { errored: false };
		}

		return null;
	}

	state = {
		errored: false,
	};

	handleError = () => {
		this.setState({ errored: true });
	};

	render = ({ small, large, src, description, status, className, style }: AvatarProps, { errored }: AvatarState) => (
		<div
			aria-label='User picture'
			className={createClassName(styles, 'avatar', { small, large, nobg: src && !errored }, [className])}
			style={style}
		>
			{src && !errored && (
				<img src={src} alt={description} className={createClassName(styles, 'avatar__image')} onError={this.handleError} />
			)}

			{status && <span className={createClassName(styles, 'avatar__status', { small, large, status })} />}
		</div>
	);
}
