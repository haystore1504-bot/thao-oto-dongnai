function getYoutubeEmbedUrl(url) {
  if (!url) return null;
  let videoId = null;

  const watchMatch = url.match(/(?:youtube\.com\/watch\?v=)([\w-]+)/);
  const shortMatch = url.match(/(?:youtu\.be\/)([\w-]+)/);
  const shortsMatch = url.match(/(?:youtube\.com\/shorts\/)([\w-]+)/);

  if (watchMatch) videoId = watchMatch[1];
  else if (shortMatch) videoId = shortMatch[1];
  else if (shortsMatch) videoId = shortsMatch[1];

  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}`;
}

module.exports = { getYoutubeEmbedUrl };
