Package["core-runtime"].queue("ecmascript",function () {/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var EmitterPromise = Package.meteor.EmitterPromise;
var ReactFastRefresh = Package['react-fast-refresh'].ReactFastRefresh;

/* Package-scope variables */
var ECMAScript;

(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/ecmascript/ecmascript.js                                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
ECMAScript = {
  compileForShell() {
    throw new Error('compileForShell was removed in Meteor 3. Use Babel.compileForShell instead from babel-compiler');
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
return {
  export: function () { return {
      ECMAScript: ECMAScript
    };}
}});

//# sourceURL=meteor://💻app/packages/ecmascript.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvZWNtYXNjcmlwdC9lY21hc2NyaXB0LmpzIl0sIm5hbWVzIjpbIkVDTUFTY3JpcHQiLCJjb21waWxlRm9yU2hlbGwiLCJFcnJvciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUFBLFVBQVUsR0FBRztFQUNYQyxlQUFlQSxDQUFBLEVBQUc7SUFDaEIsTUFBTSxJQUFJQyxLQUFLLENBQUMsZ0dBQWdHLENBQUM7RUFDbkg7QUFDRixDQUFDLEMiLCJmaWxlIjoiL3BhY2thZ2VzL2VjbWFzY3JpcHQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJFQ01BU2NyaXB0ID0ge1xuICBjb21waWxlRm9yU2hlbGwoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjb21waWxlRm9yU2hlbGwgd2FzIHJlbW92ZWQgaW4gTWV0ZW9yIDMuIFVzZSBCYWJlbC5jb21waWxlRm9yU2hlbGwgaW5zdGVhZCBmcm9tIGJhYmVsLWNvbXBpbGVyJyk7XG4gIH1cbn07XG4iXX0=
