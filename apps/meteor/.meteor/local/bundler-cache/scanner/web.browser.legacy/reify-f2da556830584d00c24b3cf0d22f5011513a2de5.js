module.export({SHA256:function(){return SHA256}});var binb2hex;module.link('./binb2hex',{binb2hex:function(v){binb2hex=v}},0);var core;module.link('./core',{core:function(v){core=v}},1);var str2binb;module.link('./str2binb',{str2binb:function(v){str2binb=v}},2);var utf8Encode;module.link('./utf8Encode',{utf8Encode:function(v){utf8Encode=v}},3);



function SHA256(input) {
    input = utf8Encode(input);
    const chrsz = 8;
    return binb2hex(core(str2binb(input, chrsz), input.length * chrsz));
}
//# sourceMappingURL=sha256.js.map