
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
};

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
    var key = 'kc-callback-' + state;
    var value = localStorage.getItem(key);
    this.clearExpired();
    if (value) {
      localStorage.removeItem(key);
      return JSON.parse(value);
    }
    return null;
  }

  add(state: CallbackState) {
    this.clearExpired();
    var key = 'kc-callback-' + state.state;
    localStorage.setItem(key, JSON.stringify({ ...state, expires: new Date().getTime() + (60 * 60 * 1000)}));
  }

  clearExpired() {
    var time = new Date().getTime();
    for (var i = 0; i < localStorage.length; i++)  {
      var key = localStorage.key(i);
      if (key && key.indexOf('kc-callback-') == 0) {
        var value = localStorage.getItem(key);
        if (value) {
          try {
            var expires = JSON.parse(value).expires;
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
    var value = this.getCookie('kc-callback-' + state);
    this.setCookie('kc-callback-' + state, '', this.cookieExpiration(-100));
    if (value) {
      return JSON.parse(value);
    }
  };

  add(state: CallbackState) {
    this.setCookie('kc-callback-' + state.state, JSON.stringify(state), this.cookieExpiration(60));
  }

  removeItem(key: string) {
    this.setCookie(key, '', this.cookieExpiration(-100));
  }

  getCookie(key: string) {
    var name = key + '=';
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return '';
  }

  setCookie(key: string, value: string, expirationDate: Date) {
    var cookie = key + '=' + value + '; '
      + 'expires=' + expirationDate.toUTCString() + '; ';
    document.cookie = cookie;
  };

  cookieExpiration(minutes: number) {
    var exp = new Date();
    exp.setTime(exp.getTime() + (minutes*60*1000));
    return exp;
  }
}