import { useEffect, useRef, useCallback } from 'react';
import { POLLING_INTERVAL_MS } from '../constants';

/**
 * Polls a fetch function at a regular interval.
 * Cleans up on unmount. Calls immediately on mount.
 */
export function usePolling(
  fetchFn: () => void | Promise<void>,
  intervalMs: number = POLLING_INTERVAL_MS,
  enabled: boolean = true
) {
  const savedFn = useRef(fetchFn);

  useEffect(() => {
    savedFn.current = fetchFn;
  }, [fetchFn]);

  useEffect(() => {
    if (!enabled) return;

    // call immediately
    savedFn.current();

    const id = setInterval(() => {
      savedFn.current();
    }, intervalMs);

    return () => clearInterval(id);
  }, [intervalMs, enabled]);
}

/**
 * Returns a stable callback for refreshing data with a "last updated" timestamp.
 */
export function useLastUpdated() {
  const ref = useRef<string>(new Date().toISOString());

  const markUpdated = useCallback(() => {
    ref.current = new Date().toISOString();
  }, []);

  return { lastUpdated: ref.current, markUpdated };
}
