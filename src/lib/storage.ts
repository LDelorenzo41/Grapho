import { createClient } from '@supabase/supabase-js';

const getSupabaseClient = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn('Supabase credentials not configured');
    return null;
  }

  return createClient(url, key);
};

const supabase = getSupabaseClient();

/**
 * Upload un fichier vers Supabase Storage
 * @param file - Le fichier à uploader
 * @param userId - L'ID de l'utilisateur qui upload
 * @returns Le chemin du fichier uploadé
 */
export async function uploadFile(file: File, userId: string): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  // Créer un nom de fichier unique avec timestamp
  const timestamp = Date.now();
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `${userId}/${timestamp}_${sanitizedFileName}`;

  // Upload le fichier
  const { data, error } = await supabase.storage
    .from('documents')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Upload error:', error);
    throw error;
  }

  return data.path;
}

/**
 * Obtenir l'URL publique d'un fichier
 * @param filePath - Le chemin du fichier dans le storage
 * @returns L'URL pour télécharger le fichier
 */
export async function getFileUrl(filePath: string): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  // Pour un bucket privé, on utilise createSignedUrl
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(filePath, 3600); // URL valide pendant 1 heure

  if (error) {
    console.error('Get URL error:', error);
    throw error;
  }

  return data.signedUrl;
}

/**
 * Télécharger un fichier
 * @param filePath - Le chemin du fichier dans le storage
 * @param fileName - Le nom du fichier à télécharger
 */
export async function downloadFile(filePath: string, fileName: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  // Récupérer le fichier
  const { data, error } = await supabase.storage
    .from('documents')
    .download(filePath);

  if (error) {
    console.error('Download error:', error);
    throw error;
  }

  // Créer un lien de téléchargement et le déclencher
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Supprimer un fichier du storage
 * @param filePath - Le chemin du fichier à supprimer
 */
export async function deleteFile(filePath: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabase.storage
    .from('documents')
    .remove([filePath]);

  if (error) {
    console.error('Delete error:', error);
    throw error;
  }
}