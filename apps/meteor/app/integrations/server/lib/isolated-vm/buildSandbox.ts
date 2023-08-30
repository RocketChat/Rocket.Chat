import ivm, { type Context } from 'isolated-vm';

import * as s from '../../../../../lib/utils/stringUtils';

const copyObject = (obj: Record<string, any>) => {
	const functions = Object.keys(obj).filter((key) => typeof obj[key] === 'function');
	const data = JSON.parse(JSON.stringify(obj));

	const fullObject = {
		...data,
		...Object.fromEntries(
			functions.map((functionName) => [functionName, new ivm.Callback((...args: any[]) => obj[functionName](...args))]),
		),
	};

	return new ivm.ExternalCopy(fullObject).copyInto();
};

export const buildSandbox = (context: Context) => {
	const { global: jail } = context;
	jail.setSync('global', jail.derefInto());

	jail.setSync('s', copyObject(s));
	jail.setSync('console', copyObject(console));
};
