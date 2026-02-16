const SMART_FORMS_PREFIX = 'selection-form__';

const hasSmartFormsPrefix = (value: unknown): boolean => typeof value === 'string' && value.startsWith(SMART_FORMS_PREFIX);

const hasSmartFormsActionIdDeep = (node: unknown, seen: WeakSet<object> = new WeakSet()): boolean => {
	if (!node) {
		return false;
	}

	if (Array.isArray(node)) {
		return node.some((item) => hasSmartFormsActionIdDeep(item, seen));
	}

	if (typeof node !== 'object') {
		return false;
	}

	if (seen.has(node)) {
		return false;
	}

	seen.add(node);

	const record = node as Record<string, unknown>;

	if (hasSmartFormsPrefix(record.actionId)) {
		return true;
	}

	if (hasSmartFormsPrefix(record.blockId)) {
		return true;
	}

	for (const value of Object.values(record)) {
		if (hasSmartFormsActionIdDeep(value, seen)) {
			return true;
		}
	}

	return false;
};

export const isSmartFormsLayout = (blocks: unknown): boolean => hasSmartFormsActionIdDeep(blocks);

export const isSmartFormsModalView = (view: { id?: string; blocks?: unknown } | undefined): boolean => {
	if (!view) {
		return false;
	}

	if (hasSmartFormsPrefix(view.id)) {
		return true;
	}

	return isSmartFormsLayout(view.blocks);
};
