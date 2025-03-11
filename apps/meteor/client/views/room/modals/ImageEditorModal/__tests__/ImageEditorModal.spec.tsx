import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useTranslation } from '@rocket.chat/ui-contexts';
import ImageEditorModal from '../ImageEditorModal';

jest.mock('@rocket.chat/ui-contexts', () => ({
  useTranslation: jest.fn((str) => str),
}));

describe('ImageEditorModal', () => {
  const mockFile = new File(['dummy content'], 'test.png', { type: 'image/png' });
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    URL.createObjectURL = jest.fn(() => 'blob:test');
    URL.revokeObjectURL = jest.fn();
  });

  it('renders in crop mode by default', () => {
    render(
      <ImageEditorModal
        file={mockFile}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('Crop')).toHaveAttribute('primary', 'true');
    expect(screen.getByText('Draw')).not.toHaveAttribute('primary');
  });

  it('switches to draw mode when draw button is clicked', async () => {
    render(
      <ImageEditorModal
        file={mockFile}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    fireEvent.click(screen.getByText('Draw'));
    await waitFor(() => {
      expect(screen.getByText('Draw')).toHaveAttribute('primary', 'true');
      expect(screen.getByText('Crop')).not.toHaveAttribute('primary');
    });
  });

  it('calls onClose when cancel button is clicked', () => {
    render(
      <ImageEditorModal
        file={mockFile}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onSubmit with edited file when apply button is clicked', async () => {
    render(
      <ImageEditorModal
        file={mockFile}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    fireEvent.click(screen.getByText('Apply'));
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.any(File));
    });
  });

  it('shows zoom slider only in crop mode', () => {
    render(
      <ImageEditorModal
        file={mockFile}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('Zoom')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Draw'));
    expect(screen.queryByText('Zoom')).not.toBeInTheDocument();
  });
});