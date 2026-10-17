/* Test d'intégration de session.js contre un vrai PocketBase.
   Lancé seulement si PB_TEST_URL est défini (npm run test:pb démarre une
   instance locale vierge avec le schéma de stonk-api) ; sinon ignoré. */
import { describe, it, expect, beforeAll } from 'vitest'
import { EventSource } from 'eventsource'

const URL = process.env.PB_TEST_URL
const run = URL ? describe : describe.skip

run('session.js sur PocketBase', () => {
  let S
  beforeAll(async () => {
    globalThis.EventSource = EventSource
    import.meta.env.VITE_PB_URL = URL
    S = await import('./session.js')
  })

  const players = [{ id: 'a', name: 'Alice' }, { id: 'b', name: 'Bob' }]
  const MARK = (player, zone) => ({ player, zone })

  it('crée, rejoint, lit : le code est le seul accès', async () => {
    const code = await S.createSession({ gameId: 'cricket', players, hostName: 'Alice' })
    expect(code).toMatch(/^[A-Z2-9]{6}$/)
    const peek = await S.peekSession(code.toLowerCase())
    expect(peek.players.map((p) => p.name)).toEqual(['Alice', 'Bob'])
    await expect(S.peekSession('ZZZZZZ')).rejects.toThrow('Session introuvable')
  })

  it('le temps réel livre les tirs, l’annulation et la réinitialisation', async () => {
    const code = await S.createSession({ gameId: 'cricket', players })
    const seen = []
    const unsub = S.subscribe(code, (s) => seen.push(s.actions.length))
    const until = async (n) => { for (let i = 0; i < 50 && seen.at(-1) !== n; i++) await new Promise((r) => setTimeout(r, 100)) }
    await until(0)
    expect(await S.throwDart(code, MARK('a', 1))).toBe(true)
    await S.throwDart(code, MARK('b', 2))
    await until(2)
    await S.undoLast(code)
    await until(1)
    await S.resetGame(code)
    await until(0)
    unsub()
    expect(seen.at(-1)).toBe(0)
    expect(seen).toContain(2)
  })

  it('deux appareils qui tirent en même temps : aucun tir perdu, aucun doublon', async () => {
    const code = await S.createSession({ gameId: 'cricket', players })
    await Promise.all(Array.from({ length: 6 }, (_, i) => S.throwDart(code, MARK(i % 2 ? 'a' : 'b', i % 7))))
    let last
    const unsub = S.subscribe(code, (s) => { last = s })
    for (let i = 0; i < 50 && !last; i++) await new Promise((r) => setTimeout(r, 100))
    unsub()
    expect(last.actions).toHaveLength(6)
  })

  it('refuse un tir invalide et ignore les tirs après la victoire', async () => {
    const code = await S.createSession({ gameId: 'cricket', players })
    await expect(S.throwDart(code, { player: 'a', zone: 99 })).rejects.toThrow('Tir invalide')
    for (let z = 0; z < 7; z++) for (let n = 0; n < 3; n++) await S.throwDart(code, MARK('a', z))
    expect(await S.throwDart(code, MARK('b', 1))).toBe(false)
  })
})
