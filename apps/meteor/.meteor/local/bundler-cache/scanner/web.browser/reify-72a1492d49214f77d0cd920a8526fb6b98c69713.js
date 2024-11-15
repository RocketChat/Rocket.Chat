let selection;module.link("d3-selection",{selection(v){selection=v}},0);let selection_interrupt;module.link("./interrupt",{default(v){selection_interrupt=v}},1);let selection_transition;module.link("./transition",{default(v){selection_transition=v}},2);



selection.prototype.interrupt = selection_interrupt;
selection.prototype.transition = selection_transition;
