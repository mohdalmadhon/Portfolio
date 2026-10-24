export function isLiteDevice(): boolean {
  try {
    const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false
    const small = Math.min(window.innerWidth, window.innerHeight) < 600
    const nav = navigator as Navigator & { deviceMemory?: number }
    const lowMem = typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4
    const fewCores = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true
    return coarse || small || lowMem || fewCores || saveData
  } catch {
    return false
  }
}
