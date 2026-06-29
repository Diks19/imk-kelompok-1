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
        key: '7fgt0ksnimwoudlryxx1',
        wsHost: window.location.hostname,
        wsPort: 8080,
        wssPort: 8080,
        forceTLS: false,
        enabledTransports: ['ws', 'wss'],
    });
}
