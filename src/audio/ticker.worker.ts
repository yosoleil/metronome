// Wake-up signal for the scheduler. This timer does NOT decide when clicks sound — every click is
// scheduled on the AudioContext clock — so its jitter doesn't affect timing. It lives in a Worker
// because main-thread timers are heavily throttled in background tabs.
let id: ReturnType<typeof setInterval> | undefined;

self.onmessage = (e: MessageEvent<{ type: 'start'; interval: number } | { type: 'stop' }>) => {
  clearInterval(id);
  id = undefined;
  if (e.data.type === 'start') {
    id = setInterval(() => self.postMessage('tick'), e.data.interval);
  }
};
