import { useState } from 'react';
import { Buffer } from 'buffer';

import './App.css';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).Buffer = Buffer;

const uploadToS3 = async (file: File, email: string) => {
  console.log('Uploading file to Lambda for S3 upload...');

  const fileBuffer = await file.arrayBuffer(); // Convert file to ArrayBuffer
  const fileBlob = new Uint8Array(fileBuffer); // Convert to Uint8Array

  const base64FileContent = Buffer.from(fileBlob).toString('base64');

  const apiGatewayUrl = import.meta.env.VITE_API_GATEWAY_URL || ''; // For Production this should be in secrets

  console.log('API Gateway URL:', apiGatewayUrl);

  const params = {
    fileName: file.name,
    fileContent: base64FileContent,
    contentType: file.type,
    tags: [
      {
        key: 'email',
        value: email,
      },
    ],
  };

  try {
    const response = await fetch(apiGatewayUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const result: any = response;

    // const result = await response.json();
    if (response.status === 200) {
      console.log('File uploaded successfully:', result.message);
    } else {
      console.error('Error uploading file:', result.message);
    }
  } catch (error: any) {
    console.error('Error calling API Gateway:', error.message);
  }
};

const App = () => {
  // @ts-ignore
  console.log(import.meta?.env?.VITE_API_GATEWAY_URL);
  const [file, setFile] = useState<File | null>(null);
  const [email, setEmail] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (upload) => {
      if (upload.target && typeof upload.target.result === 'string') {
        // setSrc(upload.target.result);
      }
    };
    reader.readAsDataURL(file);

    setFile(file);
  };

  const startProcess = () => {
    setIsProcessing(true);
    if (file) {
      uploadToS3(file, email);
    }
    setIsProcessing(false);
  };

  return (
    <div className='App'>
      <div>
        <input
          id='file'
          type='file'
          name='file'
          accept='image/*,application/pdf,text/plain'
          onChange={onSelectFile}
        />
        <div>
          <input
            type='email'
            placeholder='Enter your email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ margin: '20px', padding: '15px', width: '250px' }}
          />
        </div>
        <button
          onClick={startProcess}
          style={{ margin: '10px' }}
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Summarize'}
        </button>
      </div>
    </div>
  );
};

export default App;