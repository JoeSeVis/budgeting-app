import { renderLogin } from './views/login.js';
import { renderDashboard } from './views/dashboard.js';
import { checkSession } from './api.js';

const routes = {
    'login': renderLogin,
    'dashboard': renderDashboard
};

export async function initRouter() {
    const user = await checkSession();
    if (user) {
        navigate('dashboard');
    } else {
        navigate('login');
    }
}

export function navigate(route) {
    const view = routes[route];
    if (view) {
        view();
    }
}
