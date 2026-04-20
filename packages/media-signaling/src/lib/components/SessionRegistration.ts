import type { IMediaSignalLogger } from '../../definition';

const REGISTER_CONFIRMATION_TIMEOUT = 1000;
const MAX_REGISTER_ATTEMPTS = 10;

type SessionRegistrationConfig = {
	logger?: IMediaSignalLogger;
	registerFn: () => void;
};

export class SessionRegistration {
	public get registered(): boolean {
		return this.registrationConfirmed;
	}

	public get active(): boolean {
		return this.registered && !this.sessionEnded;
	}

	private sessionEnded = false;

	private registrationConfirmed = false;

	private registerConfirmationHandler: ReturnType<typeof setTimeout> | null = null;

	constructor(private config: SessionRegistrationConfig) {
		//
	}

	public register(): void {
		if (this.registerConfirmationHandler) {
			return;
		}

		this.registerAttempt(1);
	}

	public reRegister(): void {
		if (this.sessionEnded) {
			return;
		}

		this.config.logger?.debug('SessionRegistration.reRegister');
		this.clearRegisterConfirmationHandler();
		this.register();
	}

	public confirmRegistration(): void {
		this.registrationConfirmed = true;

		this.clearRegisterConfirmationHandler();
	}

	public endSession(): void {
		this.sessionEnded = true;
	}

	private clearRegisterConfirmationHandler(): void {
		if (this.registerConfirmationHandler) {
			clearTimeout(this.registerConfirmationHandler);
			this.registerConfirmationHandler = null;
		}
	}

	private registerAttempt(attempt: number): void {
		if (this.sessionEnded) {
			return;
		}
		this.config.logger?.debug('SessionRegistration.registerAttempt', attempt);
		const timeout = attempt * REGISTER_CONFIRMATION_TIMEOUT;

		this.registerConfirmationHandler = setTimeout(() => {
			this.registerConfirmationHandler = null;
			if (attempt < MAX_REGISTER_ATTEMPTS) {
				this.registerAttempt(attempt + 1);
			}
		}, timeout);

		this.config.registerFn();
	}
}
