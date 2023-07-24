import { TabsItem, Throbber } from "@rocket.chat/fuselage";
import { Dispatch, ReactElement } from "react";
import { BlockContext, type ExperimentalTabElement } from "@rocket.chat/ui-kit";
import { useUiKitState } from "../hooks/useUiKitState";
import { BlockProps } from "../utils/BlockProps";

export const UnstableTabElement = ({block, context, surfaceRenderer, index, select}: BlockProps<ExperimentalTabElement> & {select: Dispatch<number>}): ReactElement => {
    const [{ loading }, action] = useUiKitState(block, context);

    const {title, selected, disabled} = block;

    if (loading) {
        return <Throbber />
    }

    return <TabsItem
        selected={selected}
        disabled={disabled}
        onClick={() => {!disabled && select(index); action();}}
    >
        {surfaceRenderer.renderTextObject(title, 0, BlockContext.NONE)}
    </TabsItem>
};
