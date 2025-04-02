import { useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react'; // Changed to named import
import { Meteor } from 'meteor/meteor';
import { useToastBarDispatch } from '@rocket.chat/fuselage-toastbar';
import { Button } from '@rocket.chat/fuselage';

export default function QrLoginModal() {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const dispatchToast = useToastBarDispatch();

  const generateQr = useCallback(async () => {
    setIsLoading(true);
    try {
      const newToken = await Meteor.callAsync('qrLogin.generateToken');
      setToken(newToken);
      dispatchToast({
        type: 'success',
        message: 'QR code generated successfully!',
      });
    } catch (error) {
      dispatchToast({
        type: 'error',
        message: String(error instanceof Error ? error.message : 'Failed to generate QR code'),
      });
    } finally {
      setIsLoading(false);
    }
  }, [dispatchToast]);

  return (
    <div style={{ 
      textAlign: 'center', 
      padding: 20,
      maxWidth: 300,
      margin: '0 auto'
    }}>
      <h2>Mobile Login</h2>
      
      {token ? (
        <>
          <div style={{ 
            padding: 20,
            backgroundColor: 'white',
            display: 'inline-block',
            margin: '20px 0'
          }}>
            <QRCodeSVG 
              value={`rocketchat://qr-login/${token}`}
              size={256}
              level="H"
              includeMargin={true}
            />
          </div>
          <p>Scan with Rocket.Chat Mobile App</p>
        </>
      ) : (
        <Button 
          onClick={generateQr}
          disabled={isLoading}
          primary
        >
          {isLoading ? 'Generating...' : 'Generate QR Code'}
        </Button>
      )}
    </div>
  );
}