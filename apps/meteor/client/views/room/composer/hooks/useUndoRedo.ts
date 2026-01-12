import { useState, useCallback } from 'react';

interface UndoRedoState {
    past: string[];
    present: string;
    future: string[];
}

export const useUndoRedo = (initialValue: string = '') => {
    const [state, setState] = useState<UndoRedoState>({
        past: [],
        present: initialValue,
        future: [],
    });

    const canUndo = state.past.length > 0;
    const canRedo = state.future.length > 0;

    const updateValue = useCallback((newValue: string) => {
        setState((currentState) => {
            // Don't save if value hasn't changed
            if (newValue === currentState.present) return currentState;

            // Save current state to past
            return {
                past: [...currentState.past, currentState.present],
                present: newValue,
                future: [], // Clear future when new change is made
            };
        });
    }, []);

    const undo = useCallback((): string => {
        let result = '';
        setState((currentState) => {
            if (currentState.past.length === 0) {
                result = currentState.present;
                return currentState;
            }

            const previous = currentState.past[currentState.past.length - 1];
            const newPast = currentState.past.slice(0, -1);
            
            result = previous;
            return {
                past: newPast,
                present: previous,
                future: [currentState.present, ...currentState.future],
            };
        });
        return result;
    }, []);

    const redo = useCallback((): string => {
        let result = '';
        setState((currentState) => {
            if (currentState.future.length === 0) {
                result = currentState.present;
                return currentState;
            }

            const next = currentState.future[0];
            const newFuture = currentState.future.slice(1);
            
            result = next;
            return {
                past: [...currentState.past, currentState.present],
                present: next,
                future: newFuture,
            };
        });
        return result;
    }, []);

    const reset = useCallback((newValue: string = '') => {
        setState({
            past: [],
            present: newValue,
            future: [],
        });
    }, []);

    return {
        canUndo,
        canRedo,
        undo,
        redo,
        updateValue,
        reset,
    };
};
