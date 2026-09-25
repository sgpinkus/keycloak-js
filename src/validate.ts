/**
 * For validation of JWT tokens. Requires connecting to the issuing auth server
 * to grab certificate.
 */
import axios from 'axios';
import crypto from 'node:crypto';
import path from 'node:path';
import jwkToPem from 'jwk-to-pem';

export interface ValidationContext {
  authServerUrl: string,
  realm: string,
  clientId: string,
  expectedType: 'Bearer',
  notBefore?: number,
  requiredTokenAudience?: string,
}

const minTimeBetweenJwksRequests = 60; // Seconds
let jwkCache: { keys: any[] }; // This is a cache. TODO: expire items.
let lastTimeRequesTime = 0;

async function fetchKeys(context: ValidationContext): Promise<any> {
  const _url = new URL(path.join('realms', context.realm, '/protocol/openid-connect/certs'), context.authServerUrl).toString();
  return (await axios.get(_url)).data;
}

async function getKey(kid: string, context: ValidationContext) {
  const key = getCachedKey(kid);
  if (key) return key;
  const currentTime = new Date().getTime() / 1000;
  const fetchCondition = currentTime > lastTimeRequesTime + minTimeBetweenJwksRequests;
  console.debug('Server public key not found.', fetchCondition ? 'Fetching' : 'Just attempted fetch, not fetching again');
  if (fetchCondition) {
    lastTimeRequesTime = currentTime;
    jwkCache = await fetchKeys(context);
    console.debug(`Fetched ${jwkCache?.keys?.length || 0} keys`);
  }
  return getCachedKey(kid);
}

function getCachedKey(kid: string) {
  const key = jwkCache?.keys.find((key) => { return key.kid === kid; });
  if (key) return jwkToPem(key);
}


export function validateTokenStringWithContext(tokenString: string, context: ValidationContext) {
  const token = new Token(tokenString);
  return validateTokenWithContext(token, context);
}

export async function validateTokenWithContext(token: Token, context: ValidationContext) {
  const audienceData = Array.isArray(token.content.aud) ? token.content.aud : [token.content.aud];
  const realmUrl = new URL(`/realms/${context.realm}`, context.authServerUrl).toString();
  if (token.isExpired()) {
    throw new Error('Invalid token (expired)');
  } else if (!token.signed) {
    throw new Error('Invalid token (not signed)');
  } else if (token.content.typ !== context.expectedType) {
    throw new Error('Invalid token (wrong type)');
  } else if (context.notBefore && token.content.iat < context.notBefore) {
    throw new Error('Invalid token (stale token)');
  } else if (token.content.iss !== realmUrl) {
    throw new Error('Invalid token (wrong ISS)');
  }
  if (token.content.azp && token.content.azp !== context.clientId) {
    throw new Error('Invalid token (authorized party should match client id)');
  }
  if (context.requiredTokenAudience && !audienceData.includes(context.requiredTokenAudience)) {
    throw new Error('Invalid token (wrong audience)');
  }
  const verify = crypto.createVerify('RSA-SHA256');
  const publicKey = await getKey(token.header.kid, context);
  if (!publicKey) {
    throw new Error(`No authorization server public key found [kid=${token.header.kid}]`);
  }
  try {
    verify.update(token.signed);
    if (!verify.verify(publicKey, token.signature)) {
      throw new Error('Invalid token (signature)');
    } else {
      return token;
    }
  } catch (err) {
    throw new Error('Misconfigured parameters while validating token.');
  }
}

/**
 * Based on a JSON Web Token string, construct a token object. Optionally
 * if a `clientId` is provided, the token may be tested for roles with
 * `hasRole()`.
 */
export class Token {
  header: any;
  content: any;
  signature: Buffer;
  signed: string;

  /**
   * @param {String} token The JSON Web Token formatted token string.
   * @param {String} clientId Optional clientId if this is an `access_token`.
   */
  constructor(public token: string, public clientId?: string) {
    if (!token) {
      throw new Error('Invalid token (missing)');
    }
    try {
      const parts: string[] = token.split('.');
      if (parts.length != 3) {
        throw new Error('Invalid JWT. Expect 3 parts founf ${parts.length}');
      }
      const [header, content, signature] = parts as [string, string, string];
      this.header = JSON.parse(Buffer.from(header, 'base64').toString());
      this.content = JSON.parse(Buffer.from(content, 'base64').toString());
      this.signature = Buffer.from(signature, 'base64');
      this.signed = parts[0] + '.' + parts[1];
    } catch (err: any) {
      throw new Error(err?.message || 'Failed parsing JWT');
    }
  }

  isExpired() {
    return ((this.content.exp * 1000) < Date.now());
  }

  hasRole(name: string) {
    if (!this.clientId) {
      return false;
    }
    const parts = name.split(':');
    if (parts.length === 1) {
      return this.hasApplicationRole(this.clientId, parts[0]!);
    }
    if (parts.length === 2) {
      if (parts[0] === 'realm') {
        return this.hasRealmRole(parts[1]!);
      }
      return this.hasApplicationRole(parts[0]!, parts[1]!);
    }
    return false;
  }

  hasApplicationRole(appName: string, roleName: string) {
    if (!this.content.resource_access) {
      return false;
    }

    const appRoles = this.content.resource_access[appName];

    if (!appRoles) {
      return false;
    }

    return (appRoles.roles.indexOf(roleName) >= 0);
  }

  hasRealmRole(roleName: string) {
    if (!this.content.realm_access?.roles) {
      return false;
    }
    return (this.content.realm_access.roles.indexOf(roleName) >= 0);
  }
}
