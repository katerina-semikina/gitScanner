export const toChunks = (array, chunkSize) => {
  const chunks = [];

  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }

  return chunks;
};

export const getExtension = (fileName) => {
  if (!fileName) {
    return false;
  }

  return fileName.split('.').pop();
}
