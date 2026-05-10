import { useCallback, useState } from 'react';
import type { FileRejection } from 'react-dropzone';

const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024;

export interface PreparedPdfUpload {
  originalFile: File;
  arrayBuffer: ArrayBuffer;
  formData: FormData;
  metadata: {
    name: string;
    size: number;
    type: string;
    lastModified: number;
  };
}

interface UsePdfUploadState {
  selectedFile: File | null;
  preparedUpload: PreparedPdfUpload | null;
  isPreparing: boolean;
  uploadError: string | null;
}

function isPdfFile(file: File): boolean {
  const isMimePdf = file.type === 'application/pdf';
  const hasPdfExtension = file.name.toLowerCase().endsWith('.pdf');
  return isMimePdf || hasPdfExtension;
}

export function validatePdfFile(file: File): string | null {
  if (!isPdfFile(file)) {
    return 'Only PDF files are allowed.';
  }

  if (file.size > MAX_PDF_SIZE_BYTES) {
    return 'File is too large. Please upload a PDF up to 10MB.';
  }

  return null;
}

function getDropzoneError(rejections: FileRejection[]): string {
  const firstRejection = rejections[0];
  if (!firstRejection || firstRejection.errors.length === 0) {
    return 'Unable to upload this file.';
  }

  const firstError = firstRejection.errors[0];
  if (firstError.code === 'file-invalid-type') {
    return 'Invalid file type. Please upload a PDF file.';
  }

  if (firstError.code === 'too-many-files') {
    return 'Please upload only one PDF file.';
  }

  if (firstError.code === 'file-too-large') {
    return 'File is too large. Please upload a PDF up to 10MB.';
  }

  return firstError.message;
}

async function preparePdfUpload(file: File): Promise<PreparedPdfUpload> {
  const arrayBuffer = await file.arrayBuffer();
  const formData = new FormData();
  formData.append('resume', file);

  return {
    originalFile: file,
    arrayBuffer,
    formData,
    metadata: {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    },
  };
}

export function usePdfUpload() {
  const [state, setState] = useState<UsePdfUploadState>({
    selectedFile: null,
    preparedUpload: null,
    isPreparing: false,
    uploadError: null,
  });

  const clearUpload = useCallback(() => {
    setState({
      selectedFile: null,
      preparedUpload: null,
      isPreparing: false,
      uploadError: null,
    });
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (fileRejections.length > 0) {
      setState((prev) => ({
        ...prev,
        uploadError: getDropzoneError(fileRejections),
      }));
      return;
    }

    const file = acceptedFiles[0];
    if (!file) {
      setState((prev) => ({ ...prev, uploadError: 'No file selected.' }));
      return;
    }

    const validationError = validatePdfFile(file);
    if (validationError) {
      setState((prev) => ({
        ...prev,
        selectedFile: null,
        preparedUpload: null,
        uploadError: validationError,
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      selectedFile: file,
      isPreparing: true,
      uploadError: null,
    }));

    try {
      const preparedUpload = await preparePdfUpload(file);
      setState((prev) => ({
        ...prev,
        preparedUpload,
        isPreparing: false,
      }));
    } catch {
      setState((prev) => ({
        ...prev,
        preparedUpload: null,
        isPreparing: false,
        uploadError: 'Failed to prepare the PDF file. Please try again.',
      }));
    }
  }, []);

  return {
    selectedFile: state.selectedFile,
    preparedUpload: state.preparedUpload,
    isPreparing: state.isPreparing,
    uploadError: state.uploadError,
    onDrop,
    clearUpload,
  };
}
