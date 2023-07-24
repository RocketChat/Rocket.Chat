import { TabsItem, Throbber } from "@rocket.chat/fuselage";
import { Dispatch, ReactElement } from "react";
import * as UiKit from "@rocket.chat/ui-kit";
import { useUiKitState } from "../hooks/useUiKitState";
import { BlockProps } from "../utils/BlockProps";

export const ExperimentalTabElement = ({block, context, surfaceRenderer, index, select}: BlockProps<UiKit.ExperimentalTabElement> & {select: Dispatch<number>}): ReactElement => {
    const [{ loading }, action] = useUiKitState(block, context);

    const {title, selected, disabled} = block;

    if (loading) {
        return <Throbber />
    }

    return <TabsItem
        selected={selected}
        disabled={disabled}
        onClick={(e) => {!disabled && select(index); !disabled && action(e);}}
    >
        {surfaceRenderer.renderTextObject(title, 0, UiKit.BlockContext.NONE)}
    </TabsItem>
};
