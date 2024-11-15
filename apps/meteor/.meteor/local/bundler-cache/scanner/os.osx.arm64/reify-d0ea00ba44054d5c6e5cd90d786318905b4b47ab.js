module.export({prettify:()=>prettify},true);let managerOptions;module.link('./style/style-ansi.js',{managerOptions(v){managerOptions=v}},0);let printCode;module.link('./code/impl-code-frame.js',{printCode(v){printCode=v}},1);let makePrettify;module.link('./prettification.js',{makePrettify(v){makePrettify=v}},2);


const prettify = makePrettify(managerOptions, printCode, 'node');
