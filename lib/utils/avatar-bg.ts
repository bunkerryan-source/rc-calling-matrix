const PALETTE = [
  '#D4C5A2', '#C9B99F', '#B5A58B', '#A89C8E',
  '#8FA58E', '#9BAE94', '#B5B098', '#C4B79E',
  '#D8B59A', '#C9A58E', '#B8967F', '#A68270',
];

export function avatarBg(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length]!;
}
