// @vitest-environment happy-dom
/* La coquille distante relaie les fentes de GameModals. Un `<template #x>`
   toujours present rend `$slots.x` vrai meme s'il ne produit aucun noeud :
   GameModals dessine alors son encadre autour du vide. C'est ce qui affichait
   un rectangle vide sous « VICTOIRE ! » dans tous les jeux a distance. */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import RemoteGameShell from './RemoteGameShell.vue'

const mountShell = (slots = {}) =>
  mount(RemoteGameShell, {
    props: { title: 'Killer', finished: true, winnerName: 'flower power' },
    slots: { default: '<div>plateau</div>', ...slots },
  })

// Le cadre vert en pointilles qui entoure les stats du gagnant. On le cible
// par ses classes : happy-dom re-serialise le raccourci `border: 2px dashed
// var(--chalk-green)` en longhands casses, un selecteur sur le style ne matche
// donc rien meme quand le cadre est bien la.
const statsBox = (w) => w.findAll('.rounded-xl.p-4.mb-6')

describe('RemoteGameShell — modal de victoire', () => {
  it('affiche bien la victoire et son gagnant', () => {
    const w = mountShell()
    expect(w.text()).toContain('VICTOIRE')
    expect(w.text()).toContain('flower power')
    w.unmount()
  })

  it('ne dessine PAS de cadre de stats quand aucun jeu ne le remplit', () => {
    const w = mountShell()
    expect(statsBox(w)).toHaveLength(0)
    w.unmount()
  })

  it('dessine le cadre des que le jeu fournit des stats', () => {
    const w = mountShell({ 'winner-stats': '<div>12 flèches</div>' })
    expect(statsBox(w)).toHaveLength(1)
    expect(w.text()).toContain('12 flèches')
    w.unmount()
  })
})
