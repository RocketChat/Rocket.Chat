(window as any).global = window;
// @ts-ignore
// tslint:disable no-var-requires
window.Buffer = window.Buffer || require('buffer').Buffer;
