module.export({AllowedMethods:function(){return AllowedMethods}},true);var C;module.link("../messages",{C:function(v){C=v}},0);
/**
 * FIXME: TODO: Should be configurable/variable.
 */
const AllowedMethods = [
    C.ACK,
    C.BYE,
    C.CANCEL,
    C.INFO,
    C.INVITE,
    C.MESSAGE,
    C.NOTIFY,
    C.OPTIONS,
    C.PRACK,
    C.REFER,
    C.REGISTER,
    C.SUBSCRIBE
];
