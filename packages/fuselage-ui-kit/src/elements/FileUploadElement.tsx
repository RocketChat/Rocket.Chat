import { Box, Button, Throbber } from '@rocket.chat/fuselage';
import { BlockContext } from '@rocket.chat/ui-kit';
import type { FileUploadElement as UiKitFileUploadElement, FileUploadValue } from '@rocket.chat/ui-kit';
import type { ChangeEvent, ReactElement } from 'react';
import { memo, useMemo, useRef } from 'react';

import { useUiKitState } from '../hooks/useUiKitState';
import type { BlockProps } from '../utils/BlockProps';

type FileUploadElementProps = BlockProps<UiKitFileUploadElement>;

const readFileAsBase64 = (file: File): Promise<FileUploadValue> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onerror = () => reject(new Error('Failed to read file'));
		reader.onload = () => {
			const result = typeof reader.result === 'string' ? reader.result : '';
			const contentBase64 = result.includes(',') ? result.split(',')[1] : '';
			resolve({
				name: file.name,
				size: file.size,
				type: file.type,
				contentBase64,
			});
		};
		reader.readAsDataURL(file);
	});

const FileUploadElement = ({ block, context, surfaceRenderer }: FileUploadElementProps): ReactElement => {
	const [{ loading, value }, action] = useUiKitState(block, context);
	const inputRef = useRef<HTMLInputElement>(null);

	const label = useMemo(() => {
		if (!value) {
			return undefined;
		}

		const files = Array.isArray(value) ? value : [value];
		const names = files.map((file) => file.name).filter(Boolean);
		return names.length ? names.join(', ') : undefined;
	}, [value]);

	const handleClick = (): void => {
		if (!loading) {
			inputRef.current?.click();
		}
	};

	const handleChange = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
		const { files } = event.currentTarget;
		if (!files?.length) {
			return;
		}

		const selectedFiles = Array.from(files);
		try {
			const payloads = await Promise.all(selectedFiles.map(readFileAsBase64));
			const payload = block.multiple ? payloads : payloads[0];
			await action({ target: { value: payload } });
		} catch {
			// Ignore read errors to avoid blocking other UI kit actions.
		}
		event.currentTarget.value = '';
	};

	return (
		<Box>
			<input
				ref={inputRef}
				type='file'
				accept={block.accept}
				multiple={block.multiple}
				onChange={handleChange}
				style={{ display: 'none' }}
			/>
			<Button small minWidth='4ch' disabled={loading} onClick={handleClick}>
				{loading ? (
					<Throbber />
				) : block.text ? (
					surfaceRenderer.renderTextObject(block.text, 0, BlockContext.NONE)
				) : (
					'Choose file'
				)}
			</Button>
			{label && (
				<Box is='span' mis={8} fontScale='c1' color='hint'>
					{label}
				</Box>
			)}
		</Box>
	);
};

export default memo(FileUploadElement);
