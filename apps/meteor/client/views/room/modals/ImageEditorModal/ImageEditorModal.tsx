import { Modal, Box, Field, FieldGroup, Button, Slider } from '@rocket.chat/fuselage';
 import { useTranslation } from '@rocket.chat/ui-contexts';
 import type { ReactElement, ComponentProps } from 'react';
 import { useState, useCallback, useRef, useId } from 'react';
 // Import will be resolved when the package is installed
 import Cropper from 'react-easy-crop';
 import DrawingCanvas from './DrawingCanvas';
 
 type ImageEditorModalProps = {
   onClose: () => void;
   onSubmit: (editedImage: File) => void;
   file: File;
 };
 
 const ImageEditorModal = ({ onClose, file, onSubmit }: ImageEditorModalProps): ReactElement => {
   const t = useTranslation();
   const [crop, setCrop] = useState({ x: 0, y: 0 });
   const [zoom, setZoom] = useState(1);
   const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
   const [editMode, setEditMode] = useState('crop'); // 'crop' or 'draw'
   const [editedImageUrl, setEditedImageUrl] = useState(null);
   const imageUrl = URL.createObjectURL(file);
   const imageEditorFormId = useId();
   
   const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
     setCroppedAreaPixels(croppedAreaPixels);
   }, []);
   
   const createFinalImage = async () => {
     try {
       let finalImageUrl;
       
       if (editMode === 'crop') {
         finalImageUrl = await getCroppedImg(imageUrl, croppedAreaPixels);
       } else {
         finalImageUrl = editedImageUrl;
       }
       
       const finalFile = await dataURLtoFile(finalImageUrl, file.name);
       onSubmit(finalFile);
     } catch (e) {
       console.error(e);
     }
   };
   
   return (
     <Modal
       aria-labelledby={`${imageEditorFormId}-title`}
       wrapperFunction={(props: ComponentProps<typeof Box>) => (
         <Box is='form' id={imageEditorFormId} {...props} />
       )}
     >
       <Box display='flex' flexDirection='column' height='100%'>
         <Modal.Header>
           <Modal.Title id={`${imageEditorFormId}-title`}>{t('Edit_Image')}</Modal.Title>
           <Modal.Close tabIndex={-1} onClick={onClose} />
         </Modal.Header>
         <Modal.Content>
           {editMode === 'crop' ? (
             <Box position='relative' height='400px' width='100%'>
               <Cropper
                 image={imageUrl}
                 crop={crop}
                 zoom={zoom}
                 aspect={4 / 3}
                 onCropChange={setCrop}
                 onCropComplete={onCropComplete}
                 onZoomChange={setZoom}
               />
             </Box>
           ) : (
             <Box position='relative' height='400px' width='100%'>
               <DrawingCanvas 
                 image={editedImageUrl || imageUrl} 
                 onDrawingComplete={(canvas) => {
                   setEditedImageUrl(canvas.toDataURL());
                 }} 
               />
             </Box>
           )}
           
           <FieldGroup>
             <Field>
               <Box display='flex' flexDirection='row' mbs='x16'>
                 <Button 
                   small 
                   primary={editMode === 'crop'} 
                   onClick={() => setEditMode('crop')}
                   mie='x8'
                 >
                   {t('Crop')}
                 </Button>
                 <Button 
                   small 
                   primary={editMode === 'draw'} 
                   onClick={() => {
                     if (editMode === 'crop' && croppedAreaPixels) {
                       // Apply crop before switching to draw mode
                       getCroppedImg(imageUrl, croppedAreaPixels).then(setEditedImageUrl);
                     }
                     setEditMode('draw');
                   }}
                 >
                   {t('Draw')}
                 </Button>
               </Box>
             </Field>
             
             {editMode === 'crop' && (
               <Field>
                 <Box display='flex' flexDirection='column' mbs='x16'>
                   <Box fontScale='p2' mbe='x8'>{t('Zoom')}</Box>
                   <Slider
                     value={zoom}
                     handleChange={setZoom}
                     minValue={1}
                     maxValue={3}
                     stepValue={0.1}
                   />
                 </Box>
               </Field>
             )}
           </FieldGroup>
         </Modal.Content>
         <Modal.Footer>
           <Modal.FooterControllers>
             <Button secondary onClick={onClose}>
               {t('Cancel')}
             </Button>
             <Button primary onClick={createFinalImage}>
               {t('Apply')}
             </Button>
           </Modal.FooterControllers>
         </Modal.Footer>
       </Box>
     </Modal>
   );
 };
 
 // Helper function to create a cropped image
 const createImage = (url) =>
   new Promise((resolve, reject) => {
     const image = new Image();
     image.addEventListener('load', () => resolve(image));
     image.addEventListener('error', (error) => reject(error));
     image.src = url;
   });
 
 const getCroppedImg = async (imageSrc, pixelCrop) => {
   const image = await createImage(imageSrc);
   const canvas = document.createElement('canvas');
   const ctx = canvas.getContext('2d');
 
   const maxSize = Math.max(image.width, image.height);
   const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));
 
   canvas.width = pixelCrop.width;
   canvas.height = pixelCrop.height;
 
   ctx.drawImage(
     image,
     pixelCrop.x,
     pixelCrop.y,
     pixelCrop.width,
     pixelCrop.height,
     0,
     0,
     pixelCrop.width,
     pixelCrop.height
   );
 
   return canvas.toDataURL('image/jpeg');
 };
 
 const dataURLtoFile = (dataurl, filename) => {
   const arr = dataurl.split(',');
   const mime = arr[0].match(/:(.*?);/)[1];
   const bstr = atob(arr[1]);
   let n = bstr.length;
   const u8arr = new Uint8Array(n);
 
   while (n--) {
     u8arr[n] = bstr.charCodeAt(n);
   }
 
   return new File([u8arr], filename, { type: mime });
 };
 
 export default ImageEditorModal;