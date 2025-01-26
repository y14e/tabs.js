function objectAssignDeep<T extends {}, U extends any[]>(target: T, ...sources: U): any {
  for (const source of sources) {
    for (const [key, value] of Object.entries(source || {})) {
      (target as Record<string, any>)[key] = value && typeof value === 'object' && !Array.isArray(value) ? objectAssignDeep(structuredClone((target as Record<string, any>)[key] || {}), value) : structuredClone(value);
    }
  }
  return target;
}

export { objectAssignDeep };
