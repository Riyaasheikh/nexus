import React from 'react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';

// Import styles
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

interface DocumentPreviewProps {
  fileUrl: string; // This will be the URL from your Laravel backend
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({ fileUrl }) => {
  // Create an instance of the default layout plugin
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  return (
    <div className="flex flex-col h-full bg-gray-100 rounded-xl overflow-hidden shadow-inner border border-gray-200">
      <div className="flex-1 overflow-hidden">
        {/* We use a specific version of the worker that matches our installed package */}
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
          <Viewer 
            fileUrl={fileUrl} 
            plugins={[defaultLayoutPluginInstance]} 
          />
        </Worker>
      </div>
    </div>
  );
};