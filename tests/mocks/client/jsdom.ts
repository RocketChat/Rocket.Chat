import globalJsdom from 'jsdom-global';

export const enableJsdom = (): void => {
	globalJsdom('<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>', {
		url: 'http://localhost:3000',
	});
};
