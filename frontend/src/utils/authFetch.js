// Every call to the ACE API carries the login token, so the server can check who
// is asking. Installed once in main.jsx; the rest of the app keeps using fetch().
export const API_ORIGIN = 'https://ace-academy-backend-e0pi.onrender.com';

let redirecting = false;

const requestUrl = (input) => {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return input?.url || '';
};

// Session expired or was revoked: clear it and send the user to sign in again.
const endSession = () => {
  if (redirecting) return;
  redirecting = true;
  const role = (localStorage.getItem('role') || '').toLowerCase().trim();
  localStorage.clear();
  window.location.replace(role ? `/login?role=${encodeURIComponent(role)}` : '/login');
};

export function installAuthFetch() {
  const nativeFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    const url = requestUrl(input);
    if (!url.startsWith(API_ORIGIN)) return nativeFetch(input, init);

    const token = localStorage.getItem('token');
    const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
    if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);

    const response = await nativeFetch(input, { ...init, headers });

    if (response.status === 401 && token && !url.includes('/api/auth/login')) endSession();
    return response;
  };
}
