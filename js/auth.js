const USERS_DB_KEY = 'traffiq_users';
const SESSION_KEY = 'traffiq_session';

const Auth = {
    _currentUser: null,

    getUsersDb() {
        try {
            return JSON.parse(localStorage.getItem(USERS_DB_KEY)) || {};
        } catch {
            return {};
        }
    },

    saveUsersDb(users) {
        localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
    },

    async hashPassword(password) {
        if (window.crypto && window.crypto.subtle) {
            const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
            return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
        }
        let h1 = 0xdeadbeef ^ password.length;
        let h2 = 0x41c6ce57 ^ password.length;
        for (let i = 0; i < password.length; i++) {
            const ch = password.charCodeAt(i);
            h1 = Math.imul(h1 ^ ch, 2654435761);
            h2 = Math.imul(h2 ^ ch, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
        h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
        h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
        return (h2 >>> 0).toString(16) + (h1 >>> 0).toString(16);
    },

    setSession(user, remember = true) {
        this._currentUser = user;
        const payload = JSON.stringify({ email: user.email, loginAt: Date.now() });
        if (remember) {
            localStorage.setItem(SESSION_KEY, payload);
        } else {
            sessionStorage.setItem(SESSION_KEY, payload);
        }
    },

    clearSession() {
        this._currentUser = null;
        localStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(SESSION_KEY);
    },

    getSessionUser() {
        let sess = null;
        try { sess = JSON.parse(localStorage.getItem(SESSION_KEY)); } catch {}
        if (!sess) {
            try { sess = JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch {}
        }
        if (!sess || !sess.email) return null;
        const record = this.getUsersDb()[sess.email];
        if (!record) return null;
        return { name: record.name, email: record.email };
    },

    get currentUser() {
        return this._currentUser;
    },

    async login(email, password) {
        const record = this.getUsersDb()[email];
        if (!record) return { error: 'Invalid credentials. Check your email and password.' };
        if (record.passwordHash !== await this.hashPassword(password)) {
            return { error: 'Invalid credentials. Check your email and password.' };
        }
        this.setSession({ name: record.name, email: record.email }, true);
        return { user: { name: record.name, email: record.email } };
    },

    async signup(name, email, password) {
        const users = this.getUsersDb();
        if (users[email]) {
            return { error: 'An account with this email already exists. Try signing in.' };
        }
        users[email] = {
            name,
            email,
            passwordHash: await this.hashPassword(password),
            createdAt: Date.now()
        };
        this.saveUsersDb(users);
        this.setSession({ name, email }, true);
        return { user: { name, email } };
    }
};
