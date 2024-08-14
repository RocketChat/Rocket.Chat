export type ContactInfo = {
	id: string;
	name?: string;
	host: string;
};

export type VoiceCallGenericSession = {
	type: 'INCOMING' | 'OUTGOING' | 'ONGOING' | 'ERROR';
	contact: ContactInfo | null;
	transferedBy?: ContactInfo | null;
	isMuted?: boolean;
	isHeld?: boolean;
	error?: { status?: number; reason: string };
	accept?(): Promise<void>;
	end?(): void;
	mute?(mute?: boolean): void;
	hold?(held?: boolean): void;
	dtmf?(digit: string): void;
};

export type VoiceCallOngoingSession = VoiceCallGenericSession & {
	type: 'ONGOING';
	contact: ContactInfo;
	isMuted: boolean;
	isHeld: boolean;
	end(): void;
	mute(muted?: boolean): void;
	hold(held?: boolean): void;
	dtmf(digit: string): void;
};

export type VoiceCallIncomingSession = VoiceCallGenericSession & {
	type: 'INCOMING';
	contact: ContactInfo;
	transferedBy: ContactInfo | null;
	end(): void;
	accept(): Promise<void>;
};

export type VoiceCallOutgoingSession = VoiceCallGenericSession & {
	type: 'OUTGOING';
	contact: ContactInfo;
	end(): void;
};

export type VoiceCallErrorSession = VoiceCallGenericSession & {
	type: 'ERROR';
	contact: ContactInfo;
	error: { status?: number; reason: string };
	end(): void;
};

export type VoiceCallSession = VoiceCallIncomingSession | VoiceCallOngoingSession | VoiceCallOutgoingSession | VoiceCallErrorSession;

export const isVoiceCallIncomingSession = (session: VoiceCallSession | null | undefined): session is VoiceCallIncomingSession => {
	return session?.type === 'INCOMING';
};

export const isVoiceCallOngoingSession = (session: VoiceCallSession | null | undefined): session is VoiceCallOngoingSession => {
	return session?.type === 'ONGOING';
};

export const isVoiceCallOutgoingSession = (session: VoiceCallSession | null | undefined): session is VoiceCallOutgoingSession => {
	return session?.type === 'OUTGOING';
};

export const isVoiceCallErrorSession = (session: VoiceCallSession | null | undefined): session is VoiceCallErrorSession => {
	return session?.type === 'ERROR';
};
