import { Component } from 'preact';

import { createClassName } from '../helpers';
import styles from './styles.scss';

const escapeForRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export class FilesDropTarget extends Component {
	state = {
		dragLevel: 0,
	};

	handleInputRef = (ref) => {
		this.input = ref;
	};

	handleDragOver = (event) => {
		event.preventDefault();
	};

	handleDragEnter = (event) => {
		event.preventDefault();
		this.setState({ dragLevel: this.state.dragLevel + 1 });
	};

	handleDragLeave = (event) => {
		event.preventDefault();
		this.setState({ dragLevel: this.state.dragLevel - 1 });
	};

	handleDrop = (event) => {
		event.preventDefault();

		let { dragLevel } = this.state;
		if (dragLevel === 0) {
			return;
		}

		dragLevel = 0;
		this.setState({ dragLevel });

		this.handleUpload(event.dataTransfer.files);
	};

	handleInputChange = (event) => {
		this.handleUpload(event.currentTarget.files);
	};

	handleUpload = (files) => {
		const { accept, multiple, onUpload } = this.props;

		if (!onUpload) {
			return;
		}

		let filteredFiles = Array.from(files);

		if (accept) {
			const acceptMatchers = accept.split(',').map((acceptString) => {
				if (acceptString.charAt(0) === '.') {
					return ({ name }) => new RegExp(`${escapeForRegExp(acceptString)}$`, 'i').test(name);
				}

				const matchTypeOnly = /^(.+)\/\*$/i.exec(acceptString);
				if (matchTypeOnly) {
					return ({ type }) => new RegExp(`^${escapeForRegExp(matchTypeOnly[1])}/.*$`, 'i').test(type);
				}

				return ({ type }) => new RegExp(`^s${escapeForRegExp(acceptString)}$`, 'i').test(type);
			});

			filteredFiles = filteredFiles.filter((file) => acceptMatchers.some((acceptMatcher) => acceptMatcher(file)));
		}

		if (!multiple) {
			filteredFiles = filteredFiles.slice(0, 1);
		}

		filteredFiles.length && onUpload(filteredFiles);
	};

	browse = () => {
		this.input.click();
	};

	render = ({ overlayed, overlayText, accept, multiple, className, style = {}, children }, { dragLevel }) => (
		<div
			data-overlay-text={overlayText}
			onDragOver={this.handleDragOver}
			onDragEnter={this.handleDragEnter}
			onDragLeave={this.handleDragLeave}
			onDrop={this.handleDrop}
			className={createClassName(styles, 'drop', { overlayed, dragover: dragLevel > 0 }, [className])}
			style={style}
		>
			<input
				ref={this.handleInputRef}
				type='file'
				accept={accept}
				multiple={multiple}
				onChange={this.handleInputChange}
				className={createClassName(styles, 'drop__input')}
			/>
			{children}
		</div>
	);
}
