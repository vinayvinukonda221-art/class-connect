import { api } from './api';

/**
 * Uploads a file directly from the user's computer to their linked Google Drive
 * folder and local Section 21 repository, returning permanent view and download links.
 * 
 * @param {File} file - File selected from computer
 * @returns {Promise<{fileUrl: string, downloadUrl: string, fileName: string, fileSize: number, mimeType: string, fileType: string, driveFileId: string}>}
 */
export const uploadFileToDriveAndServer = async (file) => {
  if (!file) {
    throw new Error('Please select a file from your computer.');
  }

  const formData = new FormData();
  formData.append('file', file);

  const res = await api.post('/google-drive/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  if (!res.data.success || !res.data.file) {
    throw new Error(res.data.message || 'File upload failed');
  }

  const f = res.data.file;

  return {
    fileId: f.fileId || '',
    driveFileId: f.fileId || '',
    fileName: f.fileName || file.name,
    fileUrl: f.fileUrl,
    downloadUrl: f.downloadUrl || f.fileUrl,
    driveUrl: f.driveUrl,
    fileSize: f.fileSize || file.size,
    mimeType: f.mimeType || file.type,
    fileType: f.fileType || (file.name.toLowerCase().endsWith('.ppt') || file.name.toLowerCase().endsWith('.pptx') ? 'ppt' : 'pdf'),
  };
};

