import { sha256 } from 'js-sha256';
import base64Js from 'base64-js';

export function generateRandomData(len: number) {
  try {
    const array = new Uint8Array(len);
    crypto.getRandomValues(array);
    return array;
  } catch (e) {
    console.info(`Generating random data via crypto.getRandomValues() failed: ${e.message}. Using Math.random()`);
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

export function generateCodeVerifier(len: number) {
  return generateRandomString(len, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');
}

export function generateRandomString(len: number, alphabet: string){
  const randomData = generateRandomData(len);
  const chars = new Array(len);
  for (let i = 0; i < len; i++) {
    chars[i] = alphabet.charCodeAt(randomData[i] % alphabet.length);
  }
  return String.fromCharCode.apply(null, chars);
}

export function generatePkceChallenge(pkceMethod: 'S256', codeVerifier: string) {
  switch (pkceMethod) {
    // The use of the "plain" method is considered insecure and therefore not supported.
    case 'S256': {
      // hash codeVerifier, then encode as url-safe base64 without padding
      const hashBytes = new Uint8Array(sha256.arrayBuffer(codeVerifier));
      const encodedHash = base64Js.fromByteArray(hashBytes)
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '');
      return encodedHash;
    }
    default:
      throw 'Invalid value for pkceMethod';
  }
}