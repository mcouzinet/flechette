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
      // same pattern the local games use to return to the home screen
      if (this.$parent) this.$parent.currentComponent = null
    },
  },
}
</script>
