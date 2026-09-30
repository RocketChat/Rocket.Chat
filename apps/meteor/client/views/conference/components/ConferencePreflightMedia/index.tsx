import type { PreflightMedia } from '@rocket.chat/ui-conference';

import PreflightDevices from './PreflightDevices';
import PreflightPreview from './PreflightPreview';
import PreviewMediaProvider from './PreviewMediaProvider';

/** The reader's own camera and microphone on the preflight, for a provider that runs the call in here. */
export const conferencePreflightMedia: PreflightMedia = {
	Provider: PreviewMediaProvider,
	renderPreview: (placeholder) => <PreflightPreview placeholder={placeholder} />,
	renderDevices: () => <PreflightDevices />,
};
