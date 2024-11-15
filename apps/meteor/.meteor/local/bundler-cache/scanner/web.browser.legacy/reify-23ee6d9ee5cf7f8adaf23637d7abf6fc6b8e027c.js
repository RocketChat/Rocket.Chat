module.export({name:function(){return name},version:function(){return version},Core:function(){return Core},Web:function(){return Web}});var LIBRARY_VERSION;module.link("./version",{LIBRARY_VERSION:function(v){LIBRARY_VERSION=v}},0);module.link("./api",{"*":"*"},1);module.link("./grammar",{"*":"*"},2);var Core;module.link("./core",{"*":function(v){Core=v}},3);var Web;module.link("./platform/web",{"*":function(v){Web=v}},4);// Helpful name and version exports

const version = LIBRARY_VERSION;
const name = "sip.js";

// Export api

// Export grammar

// Export namespaced core


// Export namespaced web


