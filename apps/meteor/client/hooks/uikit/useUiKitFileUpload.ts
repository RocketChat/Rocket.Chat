import type { UiKitContext } from '@rocket.chat/fuselage-ui-kit';
import { useCallback, useMemo, useState } from 'react';
import type { ContextType } from 'react';

import { uploadUiKitFile } from '../../lib/uikit/uploadUiKitFile';

type FileUploadContext = Pick<ContextType<typeof UiKitContext>, 'uploadFile' | 'setUploading' | 'uploading'>;

/** The `file_input` support of a view surface; without a room there is nowhere to store the files. */
export const useUiKitFileUpload = (rid: string | undefined): FileUploadContext => {
	const [uploadingActions, setUploadingActions] = useState<ReadonlySet<string>>(new Set());

	const uploadFile = useMemo(() => (rid ? (file: File) => uploadUiKitFile(rid, file) : undefined), [rid]);

	const setUploading = useCallback((actionId: string, uploading: boolean) => {
		setUploadingActions((current) => {
			const next = new Set(current);
			if (uploading) {
				next.add(actionId);
			} else {
				next.delete(actionId);
			}
			return next;
		});
	}, []);

	return { uploadFile, setUploading, uploading: uploadingActions.size > 0 };
};
