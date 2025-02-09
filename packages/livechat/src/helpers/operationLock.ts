export class OperationLock {
	private lockId: string;

	constructor(lockId: string) {
		this.lockId = `livechat-oplock-${lockId.toLocaleLowerCase()}`;
	}

	acquire(): boolean {
		if (this.isLocked()) {
			return false;
		}

		window.localStorage.setItem(this.lockId, 'true');
		return true;
	}

	release(): void {
		window.localStorage.removeItem(this.lockId);
	}

	isLocked(): boolean {
		return window.localStorage.getItem(this.lockId) === 'true';
	}
}
