import 'whatwg-fetch';
import cssVars from 'css-vars-ponyfill';

if (typeof window.CSS === 'undefined' || typeof CSS.supports !== 'function' || !CSS.supports('--foo: bar')) {
	cssVars();
}
