// Client PocketBase (stonk-api.tolarianstudio.com), remplaçant de Firebase.
// Importé seulement par des modules chargés à la demande (parties à distance,
// comptes, résultats) : rien de tout ça n'est sur le chemin du premier rendu.
import PocketBase from 'pocketbase'

export const PB_URL = import.meta.env.VITE_PB_URL || 'https://stonk-api.tolarianstudio.com'
export const pb = new PocketBase(PB_URL)
// Le SDK annule par défaut une requête identique en vol : nos relectures
// successives (tir puis relecture du journal) doivent toutes aboutir.
pb.autoCancellation(false)
