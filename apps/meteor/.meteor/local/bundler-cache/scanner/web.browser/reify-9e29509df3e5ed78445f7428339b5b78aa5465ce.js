module.export({name:()=>name,version:()=>version,Core:()=>Core,Web:()=>Web});let LIBRARY_VERSION;module.link("./version.js",{LIBRARY_VERSION(v){LIBRARY_VERSION=v}},0);module.link("./api/index.js",{"*":"*"},1);module.link("./grammar/index.js",{"*":"*"},2);let Core;module.link("./core/index.js",{"*"(v){Core=v}},3);let Web;module.link("./platform/web/index.js",{"*"(v){Web=v}},4);// Helpful name and version exports

const version = LIBRARY_VERSION;
const name = "sip.js";

// Export api

// Export grammar

// Export namespaced core


// Export namespaced web


