// hooks/useTokenCheck.ts
import { useEffect, useState } from 'react';

export function useTokenCheck() {
  const [tokenExpired, setTokenExpired] = useState(false);

  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem('token'); // ou UserLocalStorage.token
      if (!token) return setTokenExpired(true);

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp - now <= 0) setTokenExpired(true);
      } catch {
        setTokenExpired(true);
      }
    };

    checkToken();
    const interval = setInterval(checkToken, 10000);
    return () => clearInterval(interval);
  }, []);

  return tokenExpired;
}
