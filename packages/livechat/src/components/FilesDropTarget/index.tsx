import type { ComponentChildren, Ref } from 'preact';
import { useState, type CSSProperties, type ChangeEvent, type TargetedEvent, useContext } from 'preact/compat';

import { createClassName } from '../../helpers/createClassName';
import { UploadsContext } from '../../routes/Chat/component';
import styles from './styles.scss';

const escapeForRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

type FilesDropTargetProps = {
	overlayed?: boolean;
	overlayText?: string;
	accept?: string;
	multiple?: boolean;
	className?: string;
	style?: CSSProperties;
	children?: ComponentChildren;
	inputRef?: Ref<HTMLInputElement>;
	onUpload?: (files: File[]) => void;
};

export const FilesDropTarget = ({
	overlayed,
	overlayText,
	accept,
	multiple,
	className,
	style = {},
	children,
	inputRef,
	onUpload,
}: FilesDropTargetProps) => {
	const uploads = useContext(UploadsContext);
	const [dragLevel, setDragLevel] = useState(0);

	const handleDragOver = (event: TargetedEvent<HTMLElement, DragEvent>) => {
		if (!uploads) {
			return;
		}
		event.preventDefault();
	};

	const handleDragEnter = (event: TargetedEvent<HTMLElement, DragEvent>) => {
		if (!uploads) {
			return;
		}
		event.preventDefault();
		setDragLevel(dragLevel + 1);
	};

	const handleDragLeave = (event: TargetedEvent<HTMLElement, DragEvent>) => {
		if (!uploads) {
			return;
		}
		event.preventDefault();
		setDragLevel(dragLevel - 1);
	};

	const handleDrop = (event: TargetedEvent<HTMLElement, DragEvent>) => {
		if (!uploads) {
			return;
		}
		event.preventDefault();

		if (dragLevel === 0 || !event?.dataTransfer?.files?.length) {
			return;
		}

		setDragLevel(0);

		handleUpload(event?.dataTransfer?.files);
	};

	const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
		if (!uploads) {
			return;
		}

		if (!event?.currentTarget?.files?.length) {
			return;
		}

		handleUpload(event.currentTarget.files);
	};

	const handleUpload = (files: FileList) => {
		if (!onUpload) {
			return;
		}

		let filteredFiles = Array.from(files);

		if (accept) {
			const acceptMatchers = accept.split(',').map((acceptString) => {
				if (acceptString.charAt(0) === '.') {
					return ({ name }: { name: string }) => new RegExp(`${escapeForRegExp(acceptString)}$`, 'i').test(name);
				}

				const matchTypeOnly = /^(.+)\/\*$/i.exec(acceptString);
				if (matchTypeOnly) {
					return ({ type }: { type: string }) => new RegExp(`^${escapeForRegExp(matchTypeOnly[1])}/.*$`, 'i').test(type);
				}

				return ({ type }: { type: string }) => new RegExp(`^s${escapeForRegExp(acceptString)}$`, 'i').test(type);
			});

			filteredFiles = filteredFiles.filter((file) => acceptMatchers.some((acceptMatcher) => acceptMatcher(file)));
		}

		if (!multiple) {
			filteredFiles = filteredFiles.slice(0, 1);
		}

		filteredFiles.length && onUpload(filteredFiles);
	};

	return (
		<div
			data-overlay-text={overlayText}
			onDragOver={handleDragOver}
			onDragEnter={handleDragEnter}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
			className={createClassName(styles, 'drop', { overlayed, dragover: dragLevel > 0 }, [className])}
			style={style}
		>
			<input
				ref={inputRef}
				type='file'
				accept={accept}
				multiple={multiple}
				onChange={handleInputChange}
				className={createClassName(styles, 'drop__input')}
			/>
			{children}
		</div>
	);
};
