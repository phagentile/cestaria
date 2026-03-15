export function formatTime(totalSeconds: number): string {
  const mins = Math.floor(Math.abs(totalSeconds) / 60);
  const secs = Math.floor(Math.abs(totalSeconds) % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function formatTimeMs(totalSeconds: number): string {
  const mins = Math.floor(Math.abs(totalSeconds) / 60);
  const secs = Math.floor(Math.abs(totalSeconds) % 60);
  const ms = Math.floor((Math.abs(totalSeconds) % 1) * 10);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${ms}`;
}

export function formatMinSec(minute: number, second: number): string {
  return `${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;
}
