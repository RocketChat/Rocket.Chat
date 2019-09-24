/*
	* Code from https://github.com/dleitee/valid.js
	* Checks for email
	* @params email
	* @return boolean
	*/
export const isEmail = (email) => {
	const sQtext = '[^\\x0d\\x22\\x5c]';
	const sDtext = '[^\\x0d\\x5b-\\x5d]';
	const sAtom = '[^\\x00-\\x20\\x22\\x28\\x29\\x2c\\x2e\\x3a-\\x3c\\x3e\\x40\\x5b-\\x5d]+';
	const sQuotedPair = '\\x5c[\\x00-\\x7f]';
	const sDomainLiteral = `\\x5b(${ sDtext }|${ sQuotedPair })*\\x5d`;
	const sQuotedString = `\\x22(${ sQtext }|${ sQuotedPair })*\\x22`;
	const sDomainRef = sAtom;
	const sSubDomain = `(${ sDomainRef }|${ sDomainLiteral })`;
	const sWord = `(${ sAtom }|${ sQuotedString })`;
	const sDomain = `${ sSubDomain }(\\x2e${ sSubDomain })*`;
	const sLocalPart = `${ sWord }(\\x2e${ sWord })*`;
	const sAddrSpec = `${ sLocalPart }\\x40${ sDomain }`;
	const sValidEmail = `^${ sAddrSpec }$`;
	const reg = new RegExp(sValidEmail);
	return reg.test(email);
};
