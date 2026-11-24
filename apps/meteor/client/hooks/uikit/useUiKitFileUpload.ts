import type { UiKitContext } from '@rocket.chat/fuselage-ui-kit';
import { useMemo } from 'react';
import type { ContextType } from 'react';

import { uploadUiKitFile } from '../../lib/uikit/uploadUiKitFile';

type FileUploadContext = Pick<ContextType<typeof UiKitContext>, 'uploadFile'>;

/** The `file_input` support of a view surface; without a room there is nowhere to store the files. */
export const useUiKitFileUpload = (rid: string | undefined): FileUploadContext => {
	const uploadFile = useMemo(() => (rid ? (file: File) => uploadUiKitFile(rid, file) : undefined), [rid]);

	return { uploadFile };
};
