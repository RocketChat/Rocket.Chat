/**
 * The forms this server can announce its users' call memberships in, one per Element Call generation. Every form is
 * always read, whichever one is announced.
 */
export const MATRIXRTC_PROFILES = ['compatibility', 'matrix_2_0', 'matrix_2_0_msc4195'] as const;

export type MatrixRTCProfile = (typeof MATRIXRTC_PROFILES)[number];

const isMatrixRTCProfile = (value: string): value is MatrixRTCProfile => (MATRIXRTC_PROFILES as readonly string[]).includes(value);

let enabled = false;
let profile: MatrixRTCProfile = 'compatibility';

/** An unknown profile falls back to `compatibility`, the one every Matrix client of today reads. */
export const configureMatrixRTC = (settings: { enabled: boolean; profile: string }): void => {
	enabled = settings.enabled;
	profile = isMatrixRTCProfile(settings.profile) ? settings.profile : 'compatibility';
};

/** Whether calls in federated rooms are allowed: off, this server neither announces nor reads memberships. */
export const isMatrixRTCEnabled = (): boolean => enabled;

export const getMatrixRTCProfile = (): MatrixRTCProfile => profile;
