export class MinimongoError extends Error {
	constructor(message: string, context?: { field: number | string | symbol }) {
		if (typeof message === 'string' && context?.field) {
			message += ` for field '${String(context.field)}'`;
		}

		super(message);
		this.name = 'MinimongoError';
	}

	public setPropertyError: boolean | undefined;
}
