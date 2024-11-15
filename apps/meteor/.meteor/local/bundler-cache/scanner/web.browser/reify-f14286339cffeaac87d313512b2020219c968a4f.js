let tagTester;module.link('./_tagTester.js',{default(v){tagTester=v}},0);let isIE11;module.link('./_stringTagBug.js',{isIE11(v){isIE11=v}},1);let ie11fingerprint,weakMapMethods;module.link('./_methodFingerprint.js',{ie11fingerprint(v){ie11fingerprint=v},weakMapMethods(v){weakMapMethods=v}},2);



module.exportDefault(isIE11 ? ie11fingerprint(weakMapMethods) : tagTester('WeakMap'));
