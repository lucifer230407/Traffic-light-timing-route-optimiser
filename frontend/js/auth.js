const SESSION_KEY = 'traffiq_session';

const Auth = {
    _currentUser: null,

    getToken() {
        return localStorage.getItem(SESSION_KEY);
    },

    setSession(token, user) {
        this._currentUser = user;
        localStorage.setItem(SESSION_KEY, token);
        localStorage.setItem(`${SESSION_KEY}_user`, JSON.stringify(user));
    },

    getSessionUser() {
        if (!this.getToken()) return null;
        try {
            return JSON.parse(localStorage.getItem(`${SESSION_KEY}_user`));
        } catch {
            return null;
        }
    },

    get currentUser() {
        return this._currentUser;
    },

    clearSession() {
        this._currentUser = null;
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(`${SESSION_KEY}_user`);
        sessionStorage.removeItem(SESSION_KEY);
    },

    async login(email, password) {
        try {
            const result = await Api.request('/auth/login', {
                method: 'POST',
                body: { email, password }
            });
            this.setSession(result.token, result.user);
            return { user: result.user };
        } catch (error) {
            return { error: error.message };
        }
    },

    async signup(name, email, password) {
        try {
            const result = await Api.request('/auth/signup', {
                method: 'POST',
                body: { name, email, password }
            });
            this.setSession(result.token, result.user);
            return { user: result.user };
        } catch (error) {
            return { error: error.message };
        }
    }
};
