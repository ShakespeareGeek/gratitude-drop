// Simple encoding/decoding for note IDs to short codes
// Uses base36 with a simple scrambling algorithm to obscure the actual ID

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';
const SCRAMBLE_KEY = 17; // Prime number for scrambling

export function encodeNoteId(noteId: number): string {
  // Scramble the ID to make it less obvious
  const scrambled = (noteId * SCRAMBLE_KEY) % 1296; // 1296 = 36^2, keeps it within 2 chars usually
  
  // Convert to base36
  let result = '';
  let num = scrambled;
  
  if (num === 0) return '0';
  
  while (num > 0) {
    result = ALPHABET[num % 36] + result;
    num = Math.floor(num / 36);
  }
  
  // Pad to at least 2 characters for aesthetics
  return result.padStart(2, '0');
}

export function decodeShortCode(code: string): number | null {
  if (!code || typeof code !== 'string') return null;
  
  // Convert from base36
  let num = 0;
  for (let i = 0; i < code.length; i++) {
    const char = code[i].toLowerCase();
    const index = ALPHABET.indexOf(char);
    if (index === -1) return null; // Invalid character
    num = num * 36 + index;
  }
  
  // Reverse the scrambling
  // Find the original number that when scrambled gives us 'num'
  for (let original = 1; original <= 10000; original++) { // Reasonable upper bound
    if ((original * SCRAMBLE_KEY) % 1296 === num) {
      return original;
    }
  }
  
  return null; // Could not decode
}