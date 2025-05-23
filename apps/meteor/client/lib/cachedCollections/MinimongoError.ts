/** @deprecated internal use only */
export class MinimongoError extends Error {
	constructor(message: string, context?: { field: string }) {
		if (typeof message === 'string' && context?.field) {
			message += ` for field '${context.field}'`;
		}

		super(message);
		this.name = 'MinimongoError';
	}

	public setPropertyError: boolean | undefined;
}
