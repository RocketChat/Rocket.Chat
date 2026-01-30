import { LayoutBlock } from "@rocket.chat/ui-kit";

export const disabled: readonly LayoutBlock[] = [{
    type: 'tab_navigation',
    tabs: [{
        type: 'tab',
        disabled: true,
        title: {
            type: 'plain_text',
            text: 'tab 1',
        },
        appId: 'tab_navigation',
        blockId: 'tab1',
        actionId: 'tab1',
    },
    {
        type: 'tab',
        title: {
            type: 'plain_text',
            text: 'tab 2',
        },
        appId: 'tab_navigation',
        blockId: 'tab2',
        actionId: 'tab2',
    },
    {
        type: 'tab',
        title: {
            type: 'plain_text',
            text: 'tab 3',
        },
        appId: 'tab_navigation',
        blockId: 'tab3',
        actionId: 'tab3',
    }],
}];
