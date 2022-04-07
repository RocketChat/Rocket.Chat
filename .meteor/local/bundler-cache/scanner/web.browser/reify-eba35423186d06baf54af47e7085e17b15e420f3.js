module.export({bisectRight:()=>bisectRight,bisectLeft:()=>bisectLeft,bisectCenter:()=>bisectCenter},true);let ascending;module.link("./ascending.js",{default(v){ascending=v}},0);let bisector;module.link("./bisector.js",{default(v){bisector=v}},1);let number;module.link("./number.js",{default(v){number=v}},2);



const ascendingBisect = bisector(ascending);
const bisectRight = ascendingBisect.right;
const bisectLeft = ascendingBisect.left;
const bisectCenter = bisector(number).center;
module.exportDefault(bisectRight);
