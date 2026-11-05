const Api = {
    baseUrl: window.TRAFFIQ_API_URL || '/api',

    async request(path, options = {}) {
        const headers = { ...(options.headers || {}) };
        const token = Auth.getToken();
        if (token) headers.Authorization = `Bearer ${token}`;
        if (options.body !== undefined) headers['Content-Type'] = 'application/json';

        const response = await fetch(`${this.baseUrl}${path}`, {
            ...options,
            headers,
            body: options.body === undefined ? undefined : JSON.stringify(options.body)
        });
        let payload;
        try {
            payload = await response.json();
        } catch {
            throw new Error('The API returned an invalid response.');
        }

        if (!response.ok) {
            throw new Error(payload.error || `API request failed (${response.status}).`);
        }
        return payload;
    }
};
