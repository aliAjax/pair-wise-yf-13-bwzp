export function now(): string {
  return new Date().toLocaleString("zh-CN", { hour12: false });
}
