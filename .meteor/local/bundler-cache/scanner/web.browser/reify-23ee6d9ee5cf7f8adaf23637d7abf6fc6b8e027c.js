module.export({name:()=>name,version:()=>version,Core:()=>Core,Web:()=>Web});let LIBRARY_VERSION;module.link("./version",{LIBRARY_VERSION(v){LIBRARY_VERSION=v}},0);module.link("./api",{"*":"*"},1);module.link("./grammar",{"*":"*"},2);let Core;module.link("./core",{"*"(v){Core=v}},3);let Web;module.link("./platform/web",{"*"(v){Web=v}},4);// Helpful name and version exports

const version = LIBRARY_VERSION;
const name = "sip.js";

// Export api

// Export grammar

// Export namespaced core


// Export namespaced web


