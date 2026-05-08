import { renderHook, act } from '@testing-library/react';
import { useSingleFileInput } from './useSingleFileInput';

describe('useSingleFileInput', () => {
    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('should create an input element and append it to the body', () => {
        const onSetFile = jest.fn();
        renderHook(() => useSingleFileInput(onSetFile));

        const inputs = document.querySelectorAll('input[type="file"]');
        expect(inputs).toHaveLength(1);
        expect((inputs[0] as HTMLInputElement).style.display).toBe('none');
    });

    it('should set the accept attribute based on fileType option', () => {
        const onSetFile = jest.fn();
        renderHook(() => useSingleFileInput(onSetFile, 'image', { fileType: 'video/*' }));

        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        expect(input.getAttribute('accept')).toBe('video/*');
    });

    it('should use default accept attribute if not provided', () => {
        const onSetFile = jest.fn();
        renderHook(() => useSingleFileInput(onSetFile));

        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        expect(input.getAttribute('accept')).toBe('image/*');
    });

    it('should trigger click on the input when calling onClick', () => {
        const onSetFile = jest.fn();
        const { result } = renderHook(() => useSingleFileInput(onSetFile));
        const [onClick] = result.current;

        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        const clickSpy = jest.spyOn(input, 'click');

        act(() => {
            onClick();
        });

        expect(clickSpy).toHaveBeenCalled();
    });

    it('should call onSetFile when a file is selected', () => {
        const onSetFile = jest.fn();
        renderHook(() => useSingleFileInput(onSetFile, 'test-field'));

        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        const file = new File(['foo'], 'foo.txt', { type: 'text/plain' });

        Object.defineProperty(input, 'files', {
            value: [file],
        });

        act(() => {
            input.dispatchEvent(new Event('change'));
        });

        expect(onSetFile).toHaveBeenCalledWith(file, expect.any(FormData));
        const formData = onSetFile.mock.calls[0][1] as FormData;
        expect(formData.get('test-field')).toBe(file);
    });

    it('should not call onSetFile when no file is selected', () => {
        const onSetFile = jest.fn();
        renderHook(() => useSingleFileInput(onSetFile, 'test-field'));

        const input = document.querySelector('input[type="file"]') as HTMLInputElement;

        Object.defineProperty(input, 'files', {
            value: [],
        });

        act(() => {
            input.dispatchEvent(new Event('change'));
        });

        expect(onSetFile).not.toHaveBeenCalled();
    });

    it('should remove input element on unmount', () => {
        const onSetFile = jest.fn();
        const { unmount } = renderHook(() => useSingleFileInput(onSetFile));

        expect(document.querySelectorAll('input[type="file"]')).toHaveLength(1);

        unmount();

        expect(document.querySelectorAll('input[type="file"]')).toHaveLength(0);
    });

    it('should reset input value when calling reset', () => {
        const onSetFile = jest.fn();
        const { result } = renderHook(() => useSingleFileInput(onSetFile));
        const [, reset] = result.current;

        const input = document.querySelector('input[type="file"]') as HTMLInputElement;

        const setterSpy = jest.spyOn(input, 'value', 'set');

        act(() => {
            reset();
        });

        expect(setterSpy).toHaveBeenCalledWith('');
    });

    it('should update accept attribute when fileType option changes', () => {
        const onSetFile = jest.fn();
        const { rerender } = renderHook(
            ({ fileType }: { fileType?: string }) =>
                useSingleFileInput(onSetFile, 'image', { fileType }),
            { initialProps: { fileType: 'image/*' } }
        );

        rerender({ fileType: 'video/*' });

        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        expect(input.getAttribute('accept')).toBe('video/*');
    });
});
