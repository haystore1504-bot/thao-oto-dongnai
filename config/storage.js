const supabase = require("./supabase");

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "car-images";

function safeFileName(originalname) {
  const ext = (originalname.split(".").pop() || "jpg").toLowerCase();
  const random = Date.now() + "-" + Math.random().toString(36).slice(2, 9);
  return `xe/${random}.${ext}`;
}

async function uploadImage(file) {
  const path = safeFileName(file.originalname);
  const { error } = await supabase.storage.from(BUCKET).upload(path, file.buffer, {
    contentType: file.mimetype,
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

async function uploadImages(files) {
  if (!files || !files.length) return [];
  return Promise.all(files.map(uploadImage));
}

async function deleteImage(path) {
  if (!path) return;
  await supabase.storage.from(BUCKET).remove([path]);
}

module.exports = { uploadImages, deleteImage };
