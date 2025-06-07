import { render, screen, fireEvent } from '@testing-library/react';
import { Box } from '@rocket.chat/fuselage';
import DrawingCanvas from '../DrawingCanvas';

describe('DrawingCanvas', () => {
  const mockImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const mockOnDrawingComplete = jest.fn();
  
  // Mock canvas and context
  const mockContext = {
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    closePath: jest.fn(),
    drawImage: jest.fn(),
    lineWidth: 0,
    lineCap: '',
    strokeStyle: '',
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock canvas element and context
    HTMLCanvasElement.prototype.getContext = jest.fn(() => mockContext);
    HTMLCanvasElement.prototype.getBoundingClientRect = jest.fn(() => ({
      left: 10,
      top: 10,
    }));
    
    // Mock Image constructor
    global.Image = class {
      onload: () => void;
      src: string;
      
      constructor() {
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 0);
      }
    } as any;
  });
  
  it('renders a canvas element', () => {
    render(
      <DrawingCanvas
        image={mockImage}
        onDrawingComplete={mockOnDrawingComplete}
      />
    );
    
    expect(screen.getByRole('presentation')).toBeInTheDocument();
  });
  
  it('initializes drawing context on mount', () => {
    render(
      <DrawingCanvas
        image={mockImage}
        onDrawingComplete={mockOnDrawingComplete}
      />
    );
    
    expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledWith('2d');
  });
  
  it('loads the image onto canvas on mount', () => {
    render(
      <DrawingCanvas
        image={mockImage}
        onDrawingComplete={mockOnDrawingComplete}
      />
    );
    
    // Image should be loaded
    expect(mockContext.drawImage).toHaveBeenCalled();
    
    // onDrawingComplete should be called with canvas
    expect(mockOnDrawingComplete).toHaveBeenCalled();
  });
  
  it('starts drawing on mouse down', () => {
    render(
      <DrawingCanvas
        image={mockImage}
        onDrawingComplete={mockOnDrawingComplete}
      />
    );
    
    const canvas = screen.getByRole('presentation');
    
    // Simulate mouse down at (50, 50)
    fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50 });
    
    // Should set up drawing context
    expect(mockContext.beginPath).toHaveBeenCalled();
    expect(mockContext.lineWidth).toBe(20);
    expect(mockContext.lineCap).toBe('round');
    expect(mockContext.strokeStyle).toBe('#000000');
    
    // Should start at correct position (clientX - rect.left, clientY - rect.top)
    expect(mockContext.moveTo).toHaveBeenCalledWith(40, 40); // 50-10, 50-10
  });
  
  it('draws on mouse move when drawing is active', () => {
    render(
      <DrawingCanvas
        image={mockImage}
        onDrawingComplete={mockOnDrawingComplete}
      />
    );
    
    const canvas = screen.getByRole('presentation');
    
    // Start drawing
    fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50 });
    
    // Clear previous calls
    mockOnDrawingComplete.mockClear();
    
    // Move mouse to (70, 80)
    fireEvent.mouseMove(canvas, { clientX: 70, clientY: 80 });
    
    // Should draw line to correct position
    expect(mockContext.lineTo).toHaveBeenCalledWith(60, 70); // 70-10, 80-10
    expect(mockContext.stroke).toHaveBeenCalled();
    
    // Should call onDrawingComplete with canvas
    expect(mockOnDrawingComplete).toHaveBeenCalled();
  });
  
  it('does not draw on mouse move when not drawing', () => {
    render(
      <DrawingCanvas
        image={mockImage}
        onDrawingComplete={mockOnDrawingComplete}
      />
    );
    
    const canvas = screen.getByRole('presentation');
    
    // Move mouse without pressing down first
    fireEvent.mouseMove(canvas, { clientX: 70, clientY: 80 });
    
    // Should not draw
    expect(mockContext.lineTo).not.toHaveBeenCalled();
    expect(mockContext.stroke).not.toHaveBeenCalled();
  });
  
  it('stops drawing on mouse up', () => {
    render(
      <DrawingCanvas
        image={mockImage}
        onDrawingComplete={mockOnDrawingComplete}
      />
    );
    
    const canvas = screen.getByRole('presentation');
    
    // Start drawing
    fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50 });
    
    // End drawing
    fireEvent.mouseUp(canvas);
    
    // Should end path
    expect(mockContext.closePath).toHaveBeenCalled();
  });
  
  it('stops drawing on mouse leave', () => {
    render(
      <DrawingCanvas
        image={mockImage}
        onDrawingComplete={mockOnDrawingComplete}
      />
    );
    
    const canvas = screen.getByRole('presentation');
    
    // Start drawing
    fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50 });
    
    // Leave canvas
    fireEvent.mouseLeave(canvas);
    
    // Should end path
    expect(mockContext.closePath).toHaveBeenCalled();
  });
});