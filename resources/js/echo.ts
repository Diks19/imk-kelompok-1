import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import axios from 'axios';

if (typeof window !== 'undefined') {
    (window as any).axios = axios;
    (window as any).axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

    (window as any).Pusher = Pusher;
    Pusher.logToConsole = true;

    (window as any).Echo = new Echo({
        broadcaster: 'reverb',
        key: import.meta.env.VITE_REVERB_APP_KEY,
        wsHost: import.meta.env.VITE_REVERB_HOST,
        wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
        wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
        forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
        enabledTransports: ['ws', 'wss'],
    });
}
