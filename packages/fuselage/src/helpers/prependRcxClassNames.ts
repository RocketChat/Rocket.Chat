import { prependClassName } from './prependClassName';

/** Turns each `rcx-*` prop into a class name, removing the prop. */
export const prependRcxClassNames = <T extends { className: string }>(props: T): T => {
	Object.entries(props as Record<string, unknown>).forEach(([key, value]) => {
		if (key.slice(0, 4) === 'rcx-') {
			try {
				if (!value) {
					return;
				}

				const newClassName = value === true ? key : `${key}-${value}`;
				props.className = prependClassName(props.className, newClassName);
			} finally {
				delete (props as Record<string, unknown>)[key];
			}
		}
	});

	return props;
};
