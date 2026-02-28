import { renderHook, act } from '@testing-library/react';
import { useSingleFileInput } from './useSingleFileInput';

afterEach(() => {
    document.body.innerHTML = '';
});

describe('useSingleFileInput', () => {
    it('should create an input element and append it to the body', () => {
        const onSetFile = jest.fn();
        renderHook(() => useSingleFileInput(onSetFile));

        const input = document.createElement('input');
        input.type = 'file';
        input.style.display = 'none';
        document.body.appendChild(input);
        expect(input).toBeDefined();
        expect((input as HTMLInputElement).style.display).toBe('none');
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
});
