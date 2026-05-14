import React, { createContext, useContext, useState, useEffect } from 'react';
const AuthContext = createContext({});
export function AuthProvider({ children }) {
    const [teacher, setTeacher] = useState(null);
    const [token, setToken] = useState(null);
    useEffect(() => {
        const t = localStorage.getItem('ct_token');
        const u = localStorage.getItem('ct_teacher');
        if (t && u) {
            try {
                setToken(t);
                setTeacher(JSON.parse(u));
            }
            catch {
                localStorage.clear();
            }
        }
    }, []);
    const login = (t, u) => {
        localStorage.setItem('ct_token', t);
        localStorage.setItem('ct_teacher', JSON.stringify(u));
        setToken(t);
        setTeacher(u);
    };
    const logout = () => {
        localStorage.clear();
        setToken(null);
        setTeacher(null);
    };
    return (<AuthContext.Provider value={{ teacher, token, login, logout, setTeacher }}>
      {children}
    </AuthContext.Provider>);
}
export const useAuth = () => useContext(AuthContext);
