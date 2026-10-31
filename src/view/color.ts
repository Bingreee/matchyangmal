/** 색을 섞어 밝게/어둡게 만드는 도우미 */
export function mix(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}
export const darken = (c: number, t: number) => mix(c, 0x3a2f4d, t);
export const lighten = (c: number, t: number) => mix(c, 0xffffff, t);
