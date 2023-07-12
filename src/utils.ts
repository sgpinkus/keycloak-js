import sha from 'sha.js';

export function createUUID() {
    const hexDigits = '0123456789abcdef';
    const s: string[] = generateRandomString(36, hexDigits).split('');
    s[14] = '4';
    s[19] = hexDigits.substr((s[19].charCodeAt(0) & 0x3) | 0x8, 1);
    s[8] = s[13] = s[18] = s[23] = '-';
    const uuid = s.join('');
    return uuid;
}

export function generateCodeVerifier(len: number) {
  return generateRandomString(len, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');
}

function generateRandomString(len: number, alphabet: string){
  const randomData = generateRandomData(len);
  const chars = new Array(len);
  for (let i = 0; i < len; i++) {
    chars[i] = alphabet[randomData[i] % alphabet.length];
  }
  return chars.join('');
}

export function generatePkceChallenge(pkceMethod: 'S256', codeVerifier: string) {
  switch (pkceMethod) {
    // The use of the "plain" method is considered insecure and therefore not supported.
    // shajs may use Buffer polyfill which may not support 'base64url' encoding so do ourselves.
    case 'S256': {
      return sha('sha256').update(codeVerifier).digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    }
    default:
      throw new Error('Invalid value for pkceMethod');
  }
}


export function generateRandomData(len: number) {
  try {
    const array = new Uint8Array(len);
    crypto.getRandomValues(array);
    return array;
  } catch (e) {
    return getRandomDataInsecure(len);
  }
}

export function getRandomDataInsecure(len: number) {
  const array = new Uint8Array(len);
  for (let j = 0; j < array.length; j++) {
    array[j] = Math.floor(256 * Math.random());
  }
  return array;
}


try {
  crypto.getRandomValues(new Uint8Array(1));
} catch (e) {
  console.warn(`Generating random data via crypto.getRandomValues failed: ${e.message}. Will use Math.random instead.`);
}
