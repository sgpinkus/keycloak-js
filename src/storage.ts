
export default function getCallbackStorage() {
  try {
    return new LocalStorage();
  } catch (err) {
    return new CookieStorage();
  }
}

export interface CallbackState {
	state: string,
	nonce: string,
	redirectUri: string,
  prompt?: string,
  pkceCodeVerifier?: string,
}

export interface CallbackStorage {
  get(state: string): CallbackState | null;
  add(state: CallbackState): void;
}

export class LocalStorage implements CallbackStorage {
  constructor() {
    localStorage.setItem('kc-test', 'test');
    localStorage.removeItem('kc-test');
  }

  get(state: string) {
    const key = 'kc-callback-' + state;
    const value = localStorage.getItem(key);
    this.clearExpired();
    if (value) {
      localStorage.removeItem(key);
      return JSON.parse(value);
    }
    return null;
  }

  add(state: CallbackState) {
    this.clearExpired();
    const key = 'kc-callback-' + state.state;
    localStorage.setItem(key, JSON.stringify({ ...state, expires: new Date().getTime() + (60 * 60 * 1000)}));
  }

  clearExpired() {
    const time = new Date().getTime();
    for (let i = 0; i < localStorage.length; i++)  {
      const key = localStorage.key(i);
      if (key && key.indexOf('kc-callback-') === 0) {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            const expires = JSON.parse(value).expires;
            if (!expires || expires < time) {
              localStorage.removeItem(key);
            }
          } catch (err) {
            localStorage.removeItem(key);
          }
        }
      }
    }
  }
}


export class CookieStorage implements CallbackStorage {
  get(state: string) {
    const value = this.getCookie('kc-callback-' + state);
    this.setCookie('kc-callback-' + state, '', this.cookieExpiration(-100));
    if (value) {
      return JSON.parse(value);
    }
  }

  add(state: CallbackState) {
    this.setCookie('kc-callback-' + state.state, JSON.stringify(state), this.cookieExpiration(60));
  }

  removeItem(key: string) {
    this.setCookie(key, '', this.cookieExpiration(-100));
  }

  getCookie(key: string) {
    const name = key + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) === 0) {
        return c.substring(name.length, c.length);
      }
    }
    return '';
  }

  setCookie(key: string, value: string, expirationDate: Date) {
    const cookie = key + '=' + value + '; '
      + 'expires=' + expirationDate.toUTCString() + '; ';
    document.cookie = cookie;
  }

  cookieExpiration(minutes: number) {
    const exp = new Date();
    exp.setTime(exp.getTime() + (minutes*60*1000));
    return exp;
  }
}