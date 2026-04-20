export function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((w) => {
      if (/^\d/.test(w)) return w;
      if (w.includes('/')) {
        return w.split('/').map((p) => (p ? p.charAt(0).toUpperCase() + p.slice(1) : p)).join('/');
      }
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');
}
