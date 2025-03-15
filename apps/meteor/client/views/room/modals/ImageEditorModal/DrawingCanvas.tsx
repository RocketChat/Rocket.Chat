import { Box } from '@rocket.chat/fuselage';
 import type { ReactElement } from 'react';
 import { useRef, useEffect, useState } from 'react';
 
 type DrawingCanvasProps = {
   image: string;
   onDrawingComplete: (canvas: HTMLCanvasElement) => void;
 };
 
 const DrawingCanvas = ({ image, onDrawingComplete }: DrawingCanvasProps): ReactElement => {
   const canvasRef = useRef<HTMLCanvasElement>(null);
   const [isDrawing, setIsDrawing] = useState(false);
   const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
   
   useEffect(() => {
     const canvas = canvasRef.current;
     if (!canvas) return;
     
     const context = canvas.getContext('2d');
     if (!context) return;
     
     setCtx(context);
     
     // Load the image onto the canvas
     const img = new Image();
     img.onload = () => {
       canvas.width = img.width;
       canvas.height = img.height;
       context.drawImage(img, 0, 0);
       onDrawingComplete(canvas);
     };
     img.src = image;
   }, [image, onDrawingComplete]);
   
   const startDrawing = (e) => {
     if (!ctx) return;
     setIsDrawing(true);
     ctx.beginPath();
     ctx.lineWidth = 20;
     ctx.lineCap = 'round';
     ctx.strokeStyle = '#000000';
     
     // Get canvas-relative coordinates
     const rect = canvasRef.current.getBoundingClientRect();
     const x = e.clientX - rect.left;
     const y = e.clientY - rect.top;
     
     ctx.moveTo(x, y);
   };
   
   const draw = (e) => {
     if (!isDrawing || !ctx) return;
     
     // Get canvas-relative coordinates
     const rect = canvasRef.current.getBoundingClientRect();
     const x = e.clientX - rect.left;
     const y = e.clientY - rect.top;
     
     ctx.lineTo(x, y);
     ctx.stroke();
     onDrawingComplete(canvasRef.current);
   };
   
   const stopDrawing = () => {
     if (!ctx) return;
     setIsDrawing(false);
     ctx.closePath();
   };
   
   return (
     <Box position="relative" width="100%" height="100%">
       <canvas
         ref={canvasRef}
         onMouseDown={startDrawing}
         onMouseMove={draw}
         onMouseUp={stopDrawing}
         onMouseLeave={stopDrawing}
         style={{ maxWidth: '100%', maxHeight: '100%' }}
       />
     </Box>
   );
 };
 
 export default DrawingCanvas;