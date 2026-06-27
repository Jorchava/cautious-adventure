import { setActivePinia, createPinia } from 'pinia'
import { beforeEach, describe, it, expect } from 'vitest'
import { useHistoryStore } from '@/stores/useHistoryStore'

describe('useHistoryStore', () => {
  beforeEach(() => { setActivePinia(createPinia()) })

  it('initial records is empty', () => {
    const store = useHistoryStore()
    expect(store.records).toEqual([])
  })

  it('initial isLoading is false', () => {
    const store = useHistoryStore()
    expect(store.isLoading).toBe(false)
  })

  it('initial error is null', () => {
    const store = useHistoryStore()
    expect(store.error).toBeNull()
  })
})
