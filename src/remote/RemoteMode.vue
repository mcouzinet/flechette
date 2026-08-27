<template>
  <RemoteGame v-if="view === 'game'" :code="code" @home="goHome" />
  <RemoteLobby v-else :players="players" @start="onStart" @home="goHome" />
</template>

<script>
import RemoteLobby from './RemoteLobby.vue'
import RemoteGame from './RemoteGame.vue'

export default {
  name: 'RemoteMode',
  components: { RemoteLobby, RemoteGame },
  emits: ['exit'],
  props: { players: { type: Array, default: () => [] } },
  data() {
    return { view: 'lobby', code: '' }
  },
  methods: {
    onStart(code) {
      this.code = code
      this.view = 'game'
    },
    goHome() {
      this.$emit('exit')
    },
  },
}
</script>
