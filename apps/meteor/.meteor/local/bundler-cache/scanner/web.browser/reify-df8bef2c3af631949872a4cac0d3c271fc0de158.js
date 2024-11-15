module.export({extractInitialStateFromLayout:()=>extractInitialStateFromLayout},true);let getInitialValue;module.link('./getInitialValue',{getInitialValue(v){getInitialValue=v}},0);let hasElement;module.link('./hasElement',{hasElement(v){hasElement=v}},1);let hasElements;module.link('./hasElements',{hasElements(v){hasElements=v}},2);


const isActionableElement = (element) => 'actionId' in element && typeof element.actionId === 'string';
const reduceInitialValuesFromLayoutBlock = (state, block) => {
    if (hasElement(block)) {
        if (isActionableElement(block.element)) {
            state[block.element.actionId] = {
                value: getInitialValue(block.element),
                blockId: block.blockId,
            };
        }
    }
    if (hasElements(block)) {
        for (const element of block.elements) {
            if (isActionableElement(element)) {
                state[element.actionId] = {
                    value: getInitialValue(element),
                    blockId: block.blockId,
                };
            }
        }
    }
    return state;
};
const extractInitialStateFromLayout = (blocks) => blocks.reduce(reduceInitialValuesFromLayoutBlock, {});
//# sourceMappingURL=extractInitialStateFromLayout.js.map