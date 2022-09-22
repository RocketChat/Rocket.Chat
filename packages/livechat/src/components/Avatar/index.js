import { Component } from 'preact';

import { createClassName } from '../helpers';
import styles from './styles.scss';

export class Avatar extends Component {
	static getDerivedStateFromProps(props) {
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

	render = ({ small, large, src, description, status, className, style }, { errored }) => (
		<div
			aria-label='User picture'
			aria-hidden='true'
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
