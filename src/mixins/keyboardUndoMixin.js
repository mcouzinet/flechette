export default {
  mounted() {
    this._keyHandler = (e) => {
      if (e.key === 'Backspace' && !e.target.matches('input, textarea, select')) {
        this.onUndo?.()
      }
    }
    document.addEventListener('keydown', this._keyHandler)
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this._keyHandler)
  }
}
