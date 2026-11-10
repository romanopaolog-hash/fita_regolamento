export function formatPersonName(name: string) {
  if (name.includes('@')) return name;
  return name.replace(/(^|[\s'’-])(\p{L})/gu, (_, boundary: string, initial: string) =>
    boundary + initial.toLocaleUpperCase('it-IT')
  );
}
