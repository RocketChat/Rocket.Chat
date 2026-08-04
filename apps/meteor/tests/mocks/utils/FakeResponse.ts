export class FakeResponse {
	private _body: string;

	status: number;

	headers: Record<string, string>;

	constructor(body: string, init: { status?: number; headers?: Record<string, string> } = {}) {
		this._body = body;
		this.status = init.status ?? 200;
		this.headers = init.headers ?? {};
	}

	get ok() {
		return this.status >= 200 && this.status < 300;
	}

	async json() {
		return JSON.parse(this._body);
	}

	async text() {
		return this._body;
	}
}
