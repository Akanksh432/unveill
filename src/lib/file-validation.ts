export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Magic numbers for supported formats
const MAGIC_NUMBERS = {
  PDF: [0x25, 0x50, 0x44, 0x46],
  PNG: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  JPEG: [0xff, 0xd8, 0xff],
};

function checkMagicNumber(bytes: Uint8Array, magic: number[]): boolean {
  if (bytes.length < magic.length) return false;
  for (let i = 0; i < magic.length; i++) {
    if (bytes[i] !== magic[i]) return false;
  }
  return true;
}

export async function validateFile(file: File): Promise<{ valid: boolean; error?: string }> {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "File exceeds 10MB limit." };
  }

  try {
    // Read the first 8 bytes for magic number validation
    const arrayBuffer = await file.slice(0, 8).arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    if (
      checkMagicNumber(bytes, MAGIC_NUMBERS.PDF) ||
      checkMagicNumber(bytes, MAGIC_NUMBERS.PNG) ||
      checkMagicNumber(bytes, MAGIC_NUMBERS.JPEG)
    ) {
      return { valid: true };
    }

    return { valid: false, error: "Invalid file format. Only PDF, PNG, and JPEG are allowed." };
  } catch (err) {
    return { valid: false, error: "Could not read file for validation." };
  }
}
