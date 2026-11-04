import { Box, Button, IconButton } from '@rocket.chat/fuselage';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import type * as UiKit from '@rocket.chat/ui-kit';
import type { ChangeEvent } from 'react';
import { memo, useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { UiKitContext } from '../contexts/UiKitContext';
import { useUiKitState } from '../hooks/useUiKitState';
import type { BlockProps } from '../utils/BlockProps';

export type FileInputElementProps = BlockProps<UiKit.FileInputElement>;

const DEFAULT_MAX_FILES = 10;

const getExtension = (name: string) => name.split('.').pop()?.toLowerCase() ?? '';

const FileInputElement = ({ block, context }: FileInputElementProps) => {
	const { actionId, filetypes, max_files: maxFiles = DEFAULT_MAX_FILES } = block;
	const { t } = useTranslation();
	const { uploadFile, setUploading } = useContext(UiKitContext);
	const [{ value, error }, action] = useUiKitState(block, context);

	const [names, setNames] = useState<Record<string, string>>({});
	const [message, setMessage] = useSafely(useState<string>());
	const [uploads, setUploads] = useSafely(useState(0));

	// The picks of one selection resolve out of order, so the list is kept outside the render.
	const inputRef = useRef<HTMLInputElement>(null);
	const idsRef = useRef<string[]>(value ?? []);
	const pendingRef = useRef(0);

	useEffect(
		() => () => {
			if (pendingRef.current > 0) {
				setUploading?.(actionId, false);
			}
		},
		[actionId, setUploading],
	);

	const commit = (ids: string[]) => {
		idsRef.current = ids;
		void action({ target: { value: ids } });
	};

	const finishUpload = () => {
		pendingRef.current -= 1;
		setUploads(pendingRef.current);
		if (pendingRef.current === 0) {
			setUploading?.(actionId, false);
		}
	};

	const upload = async (file: File) => {
		if (!uploadFile) {
			return;
		}

		if (pendingRef.current === 0) {
			setUploading?.(actionId, true);
		}
		pendingRef.current += 1;
		setUploads(pendingRef.current);

		try {
			const uploaded = await uploadFile(file);
			setNames((current) => ({ ...current, [uploaded._id]: uploaded.name }));
			commit([...idsRef.current, uploaded._id]);
		} catch {
			setMessage(t('UIKit_File_input_upload_failed', { name: file.name }));
		} finally {
			finishUpload();
		}
	};

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		const picked = Array.from(event.target.files ?? []);
		event.target.value = '';
		setMessage(undefined);

		const isAccepted = (file: File) => !filetypes?.length || filetypes.some((type) => type.toLowerCase() === getExtension(file.name));
		const rejected = picked.find((file) => !isAccepted(file));
		if (rejected) {
			setMessage(t('UIKit_File_input_type_not_accepted', { name: rejected.name }));
		}

		const acceptable = picked.filter(isAccepted);
		const slots = Math.max(maxFiles - idsRef.current.length - pendingRef.current, 0);
		if (acceptable.length > slots) {
			setMessage(t('UIKit_File_input_max_files', { max: maxFiles }));
		}

		acceptable.slice(0, slots).forEach((file) => void upload(file));
	};

	const handleRemove = (id: string) => commit(idsRef.current.filter((current) => current !== id));

	const ids = value ?? [];
	const full = ids.length + uploads >= maxFiles;

	return (
		<Box display='flex' flexDirection='column' alignItems='flex-start' width='full' gap={8}>
			<Button size='small' icon='clip' type='button' disabled={!uploadFile || full} onClick={() => inputRef.current?.click()}>
				{t('UIKit_File_input_choose')}
			</Button>
			<input
				ref={inputRef}
				hidden
				type='file'
				multiple={maxFiles > 1}
				accept={filetypes?.map((type) => `.${type}`).join(',')}
				aria-label={t('UIKit_File_input_choose')}
				disabled={!uploadFile || full}
				onChange={handleChange}
			/>
			{!uploadFile && <Box fontScale='c1'>{t('UIKit_File_input_unavailable')}</Box>}
			{(message || error) && (
				<Box fontScale='c1' color='danger' role='alert'>
					{message ?? error}
				</Box>
			)}
			{ids.length > 0 && (
				<Box is='ul' display='flex' flexDirection='column' gap={4} width='full' margin={0} padding={0}>
					{ids.map((id) => (
						<Box is='li' key={id} display='flex' alignItems='center' justifyContent='space-between' fontScale='p2'>
							<Box withTruncatedText>{names[id] ?? id}</Box>
							<IconButton
								size='mini'
								icon='cross'
								type='button'
								title={t('UIKit_File_input_remove_file', { name: names[id] ?? id })}
								onClick={() => handleRemove(id)}
							/>
						</Box>
					))}
				</Box>
			)}
		</Box>
	);
};

export default memo(FileInputElement);
