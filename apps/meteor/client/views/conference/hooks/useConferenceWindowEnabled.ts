import { useSetting } from '@rocket.chat/ui-contexts';

/**
 * Whether the workspace has the call-window experience turned on.
 *
 * Every site the feature changes asks this rather than reading the setting itself, so there is one answer to
 * what is gated on it. See
 * [the feature doc](../../../../../../docs/features/video-conference-persistent-chat/README.md#the-setting).
 */
export const useConferenceWindowEnabled = (): boolean => useSetting('VideoConf_Conference_Window_Enabled', false);
