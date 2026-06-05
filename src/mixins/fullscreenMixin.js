export default {
  data() {
    return { isFullscreen: false }
  },
  methods: {
    toggleFullscreen() {
      if (!this.isFullscreen) {
        (document.documentElement.requestFullscreen ||
         document.documentElement.webkitRequestFullscreen)
          ?.call(document.documentElement)
        this.isFullscreen = true
      } else {
        (document.exitFullscreen || document.webkitExitFullscreen)
          ?.call(document)
        this.isFullscreen = false
      }
    }
  }
}
