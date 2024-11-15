module.export({AllowedMethods:()=>AllowedMethods},true);let C;module.link("../messages",{C(v){C=v}},0);
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
