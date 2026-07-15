/**
 * Offline-tolerant save queue
 *
 * If a save fails due to no connection, the entry is queued in localStorage
 * and retried when connection is restored. This prevents data loss for
 * factory floor staff who may have weak signal.
 */

const QUEUE_KEY = "al-makkah-offline-queue";

export interface QueuedOperation {
  id: string;
  url: string;
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  timestamp: number;
  description: string; // Urdu description for UI display
}

export function getQueue(): QueuedOperation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as QueuedOperation[];
  } catch {
    return [];
  }
}

export function enqueue(op: Omit<QueuedOperation, "id" | "timestamp">): QueuedOperation {
  const item: QueuedOperation = {
    ...op,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
  };
  const queue = getQueue();
  queue.push(item);
  if (typeof window !== "undefined") {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }
  return item;
}

export function removeFromQueue(id: string): void {
  const queue = getQueue().filter((q) => q.id !== id);
  if (typeof window !== "undefined") {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }
}

export async function flushQueue(): Promise<{ success: number; failed: number }> {
  const queue = getQueue();
  let success = 0;
  let failed = 0;

  for (const op of queue) {
    try {
      const res = await fetch(op.url, {
        method: op.method,
        headers: { "Content-Type": "application/json" },
        body: op.body ? JSON.stringify(op.body) : undefined,
      });
      if (res.ok) {
        removeFromQueue(op.id);
        success++;
      } else {
        failed++;
      }
    } catch {
      failed++;
      break; // stop on network error
    }
  }

  return { success, failed };
}

/**
 * Wraps a fetch call with offline-queue fallback.
 * On network failure, the operation is queued and re-tried later.
 */
export async function saveWithOfflineSupport(
  url: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body: unknown,
  description: string
): Promise<{ queued: boolean; ok: boolean }> {
  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.ok) {
      return { queued: false, ok: true };
    }
    // HTTP error (not network) - don't queue, surface to user
    return { queued: false, ok: false };
  } catch {
    // Network error - queue for retry
    enqueue({ url, method, body, description });
    return { queued: true, ok: false };
  }
}
