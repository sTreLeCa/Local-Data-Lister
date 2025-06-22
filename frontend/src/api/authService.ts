interface UserCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  message: string;
  token: string;
}

export const registerUser = async (credentials: UserCredentials): Promise<AuthResponse> => {
    const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
    }
    return data;
};

export const loginUser = async (credentials: UserCredentials): Promise<AuthResponse> => {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
    });
    
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Login failed');
    }
    return data;
};