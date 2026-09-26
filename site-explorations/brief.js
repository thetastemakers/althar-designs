/* Opening figure: the agent changes, the project does not. */
(function () {
  const chips = [...document.querySelectorAll('#agents .ag:not(.ag-next)')]
  const now = document.getElementById('agent-now')
  if (!chips.length || !now) return
  let k = 0
  const show = () => {
    chips.forEach((c, j) => c.classList.toggle('is-on', j === k))
    now.textContent = chips[k].textContent
  }
  show()
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  setInterval(() => { k = (k + 1) % chips.length; show() }, 2400)
})()
