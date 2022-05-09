import { useCallback, useContext } from 'react';

import { ServerContext, UploadResult } from '../ServerContext';

export const useUpload = (
	endpoint: string,
): ((params: any, formData: any) => Promise<UploadResult> | { promise: Promise<UploadResult> }) => {
	const { uploadToEndpoint } = useContext(ServerContext);
	return useCallback((params, formData: any) => uploadToEndpoint(endpoint, params, formData), [endpoint, uploadToEndpoint]);
};
