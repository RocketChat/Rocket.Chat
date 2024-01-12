import type { ComponentChildren, Ref } from 'preact';
import type { TargetedEvent } from 'preact/compat';
import { useState } from 'preact/hooks';
import type { JSXInternal } from 'preact/src/jsx';

import { createClassName } from '../../helpers/createClassName';
import styles from './styles.scss';

const escapeForRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

type FilesDropTargetProps = {
	overlayed?: boolean;
	overlayText?: string;
	accept?: string;
	multiple?: boolean;
	className?: string;
	style?: JSXInternal.CSSProperties;
	children?: ComponentChildren;
	inputRef?: Ref<HTMLInputElement>;
	onUpload?: (files: File[]) => void;
	disabled?: boolean;
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
	disabled,
}: FilesDropTargetProps) => {
	const [dragLevel, setDragLevel] = useState(0);

	const handleDragOver = (event: DragEvent) => {
		event.preventDefault();
	};

	const handleDragEnter = (event: DragEvent) => {
		event.preventDefault();
		setDragLevel(dragLevel + 1);
	};

	const handleDragLeave = (event: DragEvent) => {
		event.preventDefault();
		setDragLevel(dragLevel - 1);
	};

	const handleDrop = (event: DragEvent) => {
		event.preventDefault();

		if (dragLevel === 0 || !event?.dataTransfer?.files?.length) {
			return;
		}

		setDragLevel(0);

		handleUpload(event?.dataTransfer?.files);
	};

	const handleInputChange = (event: TargetedEvent<HTMLInputElement>) => {
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

	if (disabled) {
		return <>{children}</>;
	}

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
