import { useRef, useCallback } from 'react';

interface UndoRedoState {
  past: string[];
  present: string;
  future: string[];
}

export const useUndoRedo = (initialValue: string = '') => {
  const state = useRef<UndoRedoState>({
    past: [],
    present: initialValue,
    future: [],
  });

  const canUndo = state.current.past.length > 0;
  const canRedo = state.current.future.length > 0;

  const updateValue = useCallback((newValue: string) => {
    // Don't save if value hasn't changed
    if (newValue === state.current.present) return;

    // Save current state to past
    state.current.past.push(state.current.present);
    state.current.present = newValue;
    // Clear future when new change is made
    state.current.future = [];
  }, []);

  const undo = useCallback(() => {
    if (!canUndo) return state.current.present;

    const previous = state.current.past.pop()!;
    state.current.future.unshift(state.current.present);
    state.current.present = previous;

    return state.current.present;
  }, [canUndo]);

  const redo = useCallback(() => {
    if (!canRedo) return state.current.present;

    const next = state.current.future.shift()!;
    state.current.past.push(state.current.present);
    state.current.present = next;

    return state.current.present;
  }, [canRedo]);

  const reset = useCallback((newValue: string = '') => {
    state.current = {
      past: [],
      present: newValue,
      future: [],
    };
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
