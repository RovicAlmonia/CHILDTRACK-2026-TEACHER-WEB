import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../api';

/**
 * useApi — fetches data from the principal API.
 *
 * @param path          - API path (e.g. '/overview'). Pass null to skip fetching.
 * @param deps          - Extra dependencies that trigger a full reload.
 * @param pollInterval  - If > 0, re-fetches silently every N milliseconds.
 *
 * Silent refetches (polling + visibilitychange) never show the loading spinner
 * so the UI doesn't flicker while data is live-updating.
 */
export function useApi(path, deps = [], pollInterval = 0) {
  const [data,        setData]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  // load(silent) — when silent=true the loading spinner is suppressed
  const load = useCallback(async (silent = false) => {
    if (!path) return;
    if (!silent) setLoading(true);
    setError('');
    try {
      const result = await apiFetch(path);
      setData(result);
      setLastUpdated(new Date());
    } catch (e) {
      // Don't clobber existing data on a silent polling failure
      if (!silent) setError(e.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [path]);

  // Initial load + dep changes always run with spinner
  useEffect(() => { load(false); }, [load, ...deps]);

  // Polling — silent background refetch
  useEffect(() => {
    if (!pollInterval || !path) return;
    const id = setInterval(() => load(true), pollInterval);
    return () => clearInterval(id);
  }, [load, path, pollInterval]);

  // Refetch silently whenever the tab becomes visible again
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && path) load(true);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [load, path]);

  return { data, loading, error, refetch: load, lastUpdated };
}