import { X, Download, Eye } from 'lucide-react';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
  fileType: 'pathology' | 'imageology' | 'additional';
}

export default function FilePreviewModal({
  isOpen,
  onClose,
  fileUrl,
  fileName,
  fileType
}: FilePreviewModalProps) {
  if (!isOpen) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFileTypeColor = () => {
    switch (fileType) {
      case 'pathology':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'imageology':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'additional':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getFileTypeLabel = () => {
    switch (fileType) {
      case 'pathology':
        return 'Pathology Report';
      case 'imageology':
        return 'Imageology Report';
      case 'additional':
        return 'Additional Document';
      default:
        return 'File';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getFileTypeColor()}`}>
              {getFileTypeLabel()}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 truncate">{fileName}</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 bg-gray-50">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="mb-4">
                  <Eye className="w-16 h-16 text-gray-400 mx-auto" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">File Preview</h4>
                <p className="text-gray-600 mb-4">
                  Click the button below to view the file in a new tab
                </p>
                <button
                  onClick={() => window.open(fileUrl, '_blank')}
                  className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Open in New Tab
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}