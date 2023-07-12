import axios from 'axios';
import { generateCodeVerifier, generatePkceChallenge, createUUID } from './utils';
import { default as getCallbackStorage, CallbackStorage } from './storage';
export { MockStorage } from './storage';

export type KcResponseMode = KeycloakConfigWithDefaults['responseMode'];

export interface KeycloakConfigWithDefaults {
  responseMode: 'fragment' | 'query',
}

export interface KeycloakConfig {
  authServerUrl: string,
  realm: string,
  clientId: string,
  redirectUri?: string,
  responseMode?: 'fragment' | 'query',
}

export interface GetLoginUrlOptions {
  scope?: string,
  prompt?: string,
  maxAge?: number,
  loginHint?: string,
  idpHint?: string,
  action?: string,
  locale?: string,
  acr?: string,
  pkceMethod?: 'S256',
}

export type CallbackParamKeys =
  'token_type' |
  'access_token' |
  'id_token' |
  'code' |
  'state' |
  'session_state' |
  'expires_in' |
  'error' |
  'error_description' |
  'error_uri' |
  'kc_action_status';

export type CallbackParams = Partial<Record<CallbackParamKeys, string>>;

export interface TokenResponse {
  access_token: string,
  id_token: string,
  refresh_token?: string,
  [x: string]: any,
}

export interface ParsedTokenResponse {
  accessToken: string,
  idToken: string,
  refreshToken?: string
  accessTokenParsed: TokenParsed,
  idTokenParsed: TokenParsed,
  refreshTokenParsed: TokenParsed,
  iatLocal: number,
}

export interface TokenParsed {
  iss: string,
  aud: string,
  sub: string,
  exp: number,
  iat: number,
  [prop: string]: any,
}

export interface CodeFlowParsedTokenResponse extends ParsedTokenResponse {
  newUrl: string,
}

const KeycloakConfigDefaults: KeycloakConfigWithDefaults = {
  responseMode: 'fragment',
};

const GetLoginUrlOptionsDefaults: GetLoginUrlOptions = {
};

export class Keycloak {
  private readonly callbackStorage: CallbackStorage;
  private readonly config: KeycloakConfig & KeycloakConfigWithDefaults;
  private readonly redirectUri: string;

  constructor(config: KeycloakConfig, storage?: CallbackStorage) {
    this.config = { ...KeycloakConfigDefaults, ...config };
    this.callbackStorage = storage || getCallbackStorage();
    this.redirectUri = config.redirectUri ?? (new URL('/', window.location.href)).toString();
  }

  getEndpoints() {
    return endpoints(this.getRealmUrl());
  }

  getRealmUrl() {
    return this.config.authServerUrl.replace(/\/+$/, '') + '/realms/' + encodeURIComponent(this.config.realm);
  }

  getLoginUrl(options: GetLoginUrlOptions = GetLoginUrlOptionsDefaults) {
    const state = createUUID();
    const nonce = createUUID();
    let scope = 'openid';
    const baseUrl = options.action === 'register' ? this.getEndpoints().register : this.getEndpoints().authorize;
    const redirectUri = this.getRedirectUri();
    const callbackState = {
      state,
      nonce,
      redirectUri,
      prompt: '',
      pkceCodeVerifier: '',
    };
    if (options.prompt) {
      callbackState.prompt = options.prompt;
    }
    if (options.scope) {
      if (scope.indexOf('openid') !== -1) {
        scope = options.scope;
      } else {
        scope = 'openid ' + options.scope;
      }
    }
    let url = baseUrl
      + '?client_id=' + encodeURIComponent(this.config.clientId)
      + '&redirect_uri=' + encodeURIComponent(redirectUri)
      + '&state=' + encodeURIComponent(state)
      + '&response_mode=' + encodeURIComponent(this.config.responseMode)
      + '&response_type=code'
      + '&scope=' + encodeURIComponent(scope)
      + '&nonce=' + encodeURIComponent(nonce);
    if (options.prompt) {
      url += '&prompt=' + encodeURIComponent(options.prompt);
    }
    if (options.maxAge) {
      url += '&max_age=' + encodeURIComponent(options.maxAge);
    }
    if (options.loginHint) {
      url += '&login_hint=' + encodeURIComponent(options.loginHint);
    }
    if (options.idpHint) {
      url += '&kc_idp_hint=' + encodeURIComponent(options.idpHint);
    }
    if (options.action && options.action !== 'register') {
      url += '&kc_action=' + encodeURIComponent(options.action);
    }
    if (options.locale) {
      url += '&ui_locales=' + encodeURIComponent(options.locale);
    }
    if (options.acr) {
      const claimsParameter = JSON.stringify({
        id_token: {
          acr: options.acr,
        },
      });
      url += '&claims=' + encodeURIComponent(claimsParameter);
    }
    if (options.pkceMethod) {
      const codeVerifier = generateCodeVerifier();
      callbackState.pkceCodeVerifier = codeVerifier;
      const pkceChallenge = generatePkceChallenge(options.pkceMethod, codeVerifier);
      url += '&code_challenge=' + pkceChallenge;
      url += '&code_challenge_method=' + options.pkceMethod;
    }

    this.callbackStorage.add(callbackState);
    return url;
  }

  getLogoutUrl(options: { idToken?: string } = {}) {
    let url = this.getEndpoints().logout
      + '?client_id=' + encodeURIComponent(this.config.clientId)
      + '&post_logout_redirect_uri=' + encodeURIComponent(this.getRedirectUri());
    if (options.idToken) {
        url += '&id_token_hint=' + encodeURIComponent(options.idToken);
    }
    return url;
  }

  getRegisterUrl(options: { action?: 'register' } = {}) {
    options.action = 'register';
    return this.getLoginUrl(options);
  }

  getAccountUrl() {
    const realm = this.getRealmUrl();
    let url: string | undefined = undefined;
    if (typeof realm !== 'undefined') {
        url = realm
        + '/account'
        + '?referrer=' + encodeURIComponent(this.config.clientId)
        + '&referrer_uri=' + encodeURIComponent(this.getRedirectUri());
    }
    return url;
  }

  getRedirectUri(): string {
    return this.redirectUri;
  }

  processCodeFlowCallbackUrl(url: string) {
    return processCodeFlowCallbackUrl(
      url,
      this.getRealmUrl(),
      this.config.clientId,
      this.config.responseMode,
      this.callbackStorage,
    );
  }

  tokenRefresh(refreshToken: string) {
    return tokenRefresh(this.getRealmUrl(), this.config.clientId, refreshToken);
  }
}

export function endpoints(realmUrl: string) {
  const _realmUrl = realmUrl.replace(/\/+$/, '');
  return {
    authorize: `${_realmUrl}/protocol/openid-connect/auth`,
    token: `${_realmUrl}/protocol/openid-connect/token`,
    logout: `${_realmUrl}/protocol/openid-connect/logout`,
    register: `${_realmUrl}/protocol/openid-connect/registrations`,
    userinfo: `${_realmUrl}/protocol/openid-connect/userinfo`,
  };
}

async function tokenRefresh(
  realmUrl: string,
  clientId: string,
  refreshToken: string,
): Promise<ParsedTokenResponse> {
  const url = endpoints(realmUrl).token;
  const params = {
    grant_type: 'refresh_token',
    client_id: clientId,
    refresh_token: refreshToken,
  };
  try {
    const tokenResponse = (await axios.post(url, new URLSearchParams(params), {
      withCredentials: true,
    })).data;
    return { ...parseTokenResponse(tokenResponse), iatLocal: Math.floor(new Date().getTime()/1000) };
  } catch (e) {
    throw new Error(`Token refresh request failed with ${e.response?.status} ${e.response?.statusText}`);
  }
}

/**
 * Parses a url. If it's a callback from AS, then exchange code for tokens, return tokens and parsed tokens.
 * If the URL is not a valid AS callback, undefined is returned. Request state, nonce
 * and certain sanity checks are made and result in an error being thrown if fail.
 * Note the tokens are not validated because we don't care we just pass then to RS which must validate properly.
 */
async function processCodeFlowCallbackUrl(
    callbackUrl: string,
    realmUrl: string,
    clientId: string,
    responseMode: KcResponseMode,
    stateStore: CallbackStorage,
): Promise<CodeFlowParsedTokenResponse | false> {
  const {
    code,
    state,
    error,
    error_description,
    error_uri,
    newUrl } = parseCodeFlowCallbackUrl(callbackUrl, responseMode) || {};
  if (!code || !state) { // If state and code are not set then it's definitely not a oauth callback.
    return false;
  }
  const storedState = stateStore.get(state);
  if (!newUrl) throw new Error(); // Type assertion.
  if (!storedState) {
    throw new CallbackValidationError('No stored state matching callback not found', newUrl);
  }
  const { prompt, nonce: storedNonce, pkceCodeVerifier, redirectUri } = storedState;

  // For ref the official adapter does this but onActionUpdate is optional and afaik undocd.
  // if (kc_action_status && onActionUpdate) {
  //   onActionUpdate(kc_action_status);
  // }

  if (error) {
    if (prompt !== 'none') {
      throw new AuthenticationServerError(error, error_description, error_uri);
    }
    return false;
  }

  // Exchange code for tokens
  const url = endpoints(realmUrl).token;
  const params = {
    'grant_type': 'authorization_code',
    code,
    'client_id': clientId,
    'redirect_uri': redirectUri,
  };
  if (pkceCodeVerifier) {
    params['code_verifier'] = pkceCodeVerifier;
  }
  try {
    const tokenResponse = (await axios.post(url, new URLSearchParams(params), {
      withCredentials: true,
    })).data;
    const iatLocal = Math.floor(new Date().getTime()/1000);
    const {
      accessToken,
      idToken,
      refreshToken,
      accessTokenParsed,
      idTokenParsed,
      refreshTokenParsed,
    } = parseTokenResponse(tokenResponse);
    if (accessTokenParsed.nonce !== storedNonce) throw new CallbackValidationError('accessToken nonce mismatch', newUrl);
    if (idTokenParsed.nonce !== storedNonce) throw new CallbackValidationError('idToken nonce mismatch', newUrl);
    if (refreshTokenParsed && refreshTokenParsed.nonce !== storedNonce) throw new CallbackValidationError('refreshToken nonce mismatch', newUrl);
    return {
      accessToken,
      idToken,
      refreshToken,
      accessTokenParsed,
      idTokenParsed,
      refreshTokenParsed,
      newUrl,
      iatLocal,
    };
  } catch (e) {
    throw new Error(`Code flow token request failed with ${e.response?.status} ${e.response?.statusText}`);
  }


}

function parseTokenResponse(tokenResponse: Record<string, any>) {
  const { access_token: accessToken, refresh_token: refreshToken, id_token: idToken } = tokenResponse;
  // Pretty sure refresh token is always supposed to be there but spec doesn't clarify.
  if (!accessToken) throw new TokenValidationError('Token response did not include an access token');
  if (!idToken) throw new TokenValidationError('Token response did not include an id token');
  if (!refreshToken) console.warn('Token response did not include a refresh token');
  const accessTokenParsed = decodeToken(accessToken);
  const idTokenParsed = decodeToken(idToken);
  const refreshTokenParsed = decodeToken(refreshToken);
  return {
    accessToken,
    idToken,
    refreshToken,
    accessTokenParsed,
    idTokenParsed,
    refreshTokenParsed,
  };
}

function decodeToken(str: string): TokenParsed {
  str = str.split('.')[1];
  str = str.replace(/-/g, '+');
  str = str.replace(/_/g, '/');
  switch (str.length % 4) {
    case 0:
      break;
    case 2:
      str += '==';
      break;
    case 3:
      str += '=';
      break;
    default:
      throw new TokenValidationError('Invalid token');
  }
  str = decodeURIComponent(escape(atob(str)));
  return JSON.parse(str);
}

/**
 * Returns hash of found kc callback params plus newUrl with callback params stripped out.
 * TODO: This should be about three LOC.
 */
function parseCodeFlowCallbackUrl(url: string, responseMode: KcResponseMode): CallbackParams & { newUrl: string } | undefined {
  function parseCodeFlowCallbackParams(paramsString: string, supportedParams: string[]):
  { remainingParamsString: string, oauthParams: CallbackParams } {
    const p = paramsString.split('&');
    const remainingParamsString = '';
    const oauthParams = {};
    for (let i = 0; i < p.length; i++) {
      const split = p[i].indexOf('=');
      const key = p[i].slice(0, split);
      if (supportedParams.indexOf(key) !== -1) {
        oauthParams[key] = p[i].slice(split + 1);
      } else {
        if (paramsString !== '') {
          paramsString += '&';
        }
        paramsString += p[i];
      }
    }
    return { remainingParamsString, oauthParams };
  }
  const supportedParams: CallbackParamKeys[] = ['error', 'error_description', 'error_uri', 'kc_action_status', 'code', 'state', 'session_state'];
  let newUrl: string = url;
  let parsed: ReturnType<typeof parseCodeFlowCallbackParams> | undefined = undefined;
  const queryIndex = url.indexOf('?');
  const fragmentIndex = url.indexOf('#');

  if (responseMode === 'query' && queryIndex !== -1) {
    newUrl = url.substring(0, queryIndex);
    parsed = parseCodeFlowCallbackParams(url.substring(queryIndex + 1, fragmentIndex !== -1 ? fragmentIndex : url.length), supportedParams);
    if (parsed.remainingParamsString !== '') {
      newUrl += '?' + parsed.remainingParamsString;
    }
    if (fragmentIndex !== -1) {
      newUrl += url.substring(fragmentIndex);
    }
  } else if (responseMode === 'fragment' && fragmentIndex !== -1) {
    newUrl = url.substring(0, fragmentIndex);
    parsed = parseCodeFlowCallbackParams(url.substring(fragmentIndex + 1), supportedParams);
    if (parsed.remainingParamsString !== '') {
      newUrl += '#' + parsed.remainingParamsString;
    }
  }
  return  { ...parsed?.oauthParams, newUrl };
}

class AuthenticationServerError extends Error {
  constructor(error: string, error_description?: string, error_uri?: string) {
    super(error);
    Object.assign(this, { error, error_description, error_uri });
  }
}

class CallbackValidationError extends Error {
  constructor(message: string, public newUrl: string) {
    super(message);
    this.newUrl = newUrl;
  }
}

class TokenValidationError extends Error {
}