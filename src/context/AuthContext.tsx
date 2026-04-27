import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Teacher {
  id: number;
  name: string;
  username: string;
  section?: string;
  photo_base64?: string | null;
}

interface AuthCtx {
  teacher: Teacher | null;
  token: string | null;
  login: (token: string, teacher: Teacher) => void;
  logout: () => void;
  setTeacher: React.Dispatch<React.SetStateAction<Teacher | null>>;
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [token, setToken]     = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem('ct_token');
    const u = localStorage.getItem('ct_teacher');
    if (t && u) {
      try {
        setToken(t);
        setTeacher(JSON.parse(u));
      } catch { localStorage.clear(); }
    }
  }, []);

  const login = (t: string, u: Teacher) => {
    localStorage.setItem('ct_token',   t);
    localStorage.setItem('ct_teacher', JSON.stringify(u));
    setToken(t);
    setTeacher(u);
  };

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setTeacher(null);
  };

  return (
    <AuthContext.Provider value={{ teacher, token, login, logout, setTeacher }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);