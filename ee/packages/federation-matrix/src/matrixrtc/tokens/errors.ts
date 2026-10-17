/** A refusal in the Matrix error format, which is how every MatrixRTC token endpoint answers one. */
export class MatrixRTCTokenError extends Error {
	constructor(
		readonly status: 400 | 401 | 403 | 404 | 500 | 502,
		readonly errcode: string,
		message: string,
	) {
		super(message);
		this.name = 'MatrixRTCTokenError';
	}
}
