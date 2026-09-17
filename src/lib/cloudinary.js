/**
 * Service d'upload Cloudinary pour Appointfy
 * Utilise l'endpoint REST non signé (Unsigned Upload Preset)
 */

export const uploadToCloudinary = async (fileOrBase64, onProgress) => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'lpskbgpz';
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'richard toll';

  if (!cloudName || !uploadPreset) {
    throw new Error('Identifiants Cloudinary non configurés dans .env');
  }

  const formData = new FormData();
  formData.append('file', fileOrBase64);
  formData.append('upload_preset', uploadPreset);

  const isVideo = fileOrBase64 instanceof File && fileOrBase64.type.startsWith('video/');
  const endpoint = isVideo ? 'video/upload' : 'auto/upload';

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${endpoint}`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || "Échec de l'envoi du fichier vers Cloudinary");
  }

  const data = await response.json();
  return {
    url: data.secure_url || data.url,
    publicId: data.public_id,
    width: data.width,
    height: data.height,
    format: data.format
  };
};