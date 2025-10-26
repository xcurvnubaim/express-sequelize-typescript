import multer from 'multer';

// Default to Multer's in-memory storage. This keeps file handling logic in the service layer.
// Controllers/routes use the helpers below to parse multipart requests; services decide persistence.

export type UploadedFile = Express.Multer.File;

const upload = multer({ storage: multer.memoryStorage() });

// Common helpers to match typical usages while keeping a single configured instance
export const uploadSingle = (fieldName: string) => upload.single(fieldName);
export const uploadArray = (fieldName: string, maxCount = 10) => upload.array(fieldName, maxCount);
export const uploadFields = (fields: Array<{ name: string; maxCount?: number }>) =>
  upload.fields(fields);

export default upload;
