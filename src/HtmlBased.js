import { u } from './utils'
import { comToPlugin } from './comToPlugin'

//------------------------------------------------------------------------------

export { u, comToPlugin }

//------------------------------------------------------------------------------

class HtmlBased {
  constructor() {
    this.selTriggerNode = null
    this.resizeTimer = null
    comToPlugin.onDiscourseRoutePushed(this._onDiscourseRoutePushed.bind(this))
    comToPlugin.onCountsChanged(({ counts }) => console.log('counts: ', counts))
  }

  connect({ discourseOrigin, timeout }) {
    return new Promise((resolve, reject) => {
      // Establish communication with the Discourse plugin
      this.resolveInit = resolve
      comToPlugin.connect({
        discourseOrigin,
        timeout,
        onTimeout: () => reject('timeout')
      })
    })
  }

  parseDom({ descr, pageName, discourseOrigin, counts }) {
    // We will resolve all links to absolute without proxy ("https://website.com/bar/index.html")
    // We start by retrieving the url of the current page url without the proxy
    const page = descr.pages.find(p => p.name === pageName)
    const pageUrlWithoutProxy = page.url

    return u.dom.onDOMReady().then(() => {
      // Modify the document links so that they open the correct url in the
      // correct place
      u.dom.forEach(document.getElementsByTagName('a'), a => {
        // Case link is empty
        if (!a.href || a.href === '#' || a.href.startsWith('javascript:')) {
          return
        }

        // Clean the link, so that it's easier to handle later:
        // - Replace the DISCOURSE placeholder by the full link
        // - Convert from relative to absolute without proxy
        // - Remove inappropriate target
        const href = a.getAttribute('href').trim()
        if (href.startsWith('DISCOURSE/')) {
          a.href = discourseOrigin + href.substring('DISCOURSE/'.length - 1)
        } else {
          a.href = new URL(href, pageUrlWithoutProxy)
        }
        if (a.target === '_parent' || a.target === '_top') {
          delete a.target
        }

        // Case the link is a discourse link: cancel the behavior and set a
        // custom click handler
        if (a.origin === discourseOrigin) {
          a.onclick = e => {
            e.preventDefault()
            e.stopPropagation()
            comToPlugin.postSetDiscourseRoute({
              route: { layout: 1, pathname: a.pathname },
              mode: 'PUSH',
              clientContext: true
            })
          }
          return
        }

        const targetUrlNoHash = a.href.split('#')[0]

        // Case it is an anchor (internal link)
        if (a.hash && targetUrlNoHash === pageUrlWithoutProxy.split('#')[0]) {
          // We need to notify the parent window AND keep the default anchor behavior
          a.onclick = () => {
            comToPlugin.postSetHash({ hash: a.hash, mode: 'REPLACE' })
          }
          return
        }

        // Case it is an external link or a link to self

        // See if there is a corresponding page in the website
        const page = descr.pages.find(
          p => p.url.split('#')[0] === targetUrlNoHash
        )

        // Case the external link points to an arbitrary external target (no
        // page found)
        if (!page) {
          if (!a.target || a.target === '_self') {
            a.target = '_parent'
          }
          return
        }

        // Case the external link points to another page of the website (or
        // to self)

        // Change the href so that cmd+click or right click+... will open
        // the Discourse instance in another tab
        a.href = discourseOrigin + '/docuss/' + page.name + a.hash

        // Regarding the simple click, cancel the default behavior and
        // let Discourse load the target page
        if (!a.target || a.target === '_self') {
          a.onclick = e => {
            e.preventDefault()
            e.stopPropagation()
            comToPlugin.postSetDiscourseRoute({
              route: { layout: 0, pageName: page.name },
              mode: 'PUSH',
              clientContext: true
            })
          }
        }
      })

      // Set the additional redirects
      // Remember that a same triggerId can have several node with different
      // dcsHighlightable property value. So we consider a trigger as
      // highligthable if any of its nodes is highligthable
      const nodes = document.getElementsByClassName('dcs-trigger')
      const ids = {}
      u.dom.forEach(nodes, node => {
        const triggerId = node.dataset.dcsTriggerId
        const highlightable = ids[triggerId] || !!node.dataset.dcsHighlightable
        ids[triggerId] = highlightable
      })
      const nonHighlitghables = Object.keys(ids).filter(id => !ids[id])
      // Here you might be tempted, if there are only nonHighlitghables
      // triggers in the page, to set a single generic redirect instead of one
      // redirect per trigger. Don't do that. Imagine the consequence if the
      // page already contains a static redirect for full page commenting
      // (WITH_SPLIT_BAR => FULL_CLIENT). Yep, infinite loop.
      const redirects = nonHighlitghables.map(triggerId => ({
        src: { layout: 2, triggerId },
        dest: { layout: 0, pageName: '@SAME_AS_SRC@' }
      }))
      comToPlugin.postSetRedirects(redirects)

      // Add click events on triggers
      const clickTargets =
        '.dcs-icons, .dcs-trigger.dcs-no-balloon .dcs-trigger-span, .dcs-trigger.dcs-no-balloon.dcs-no-span'
      u.dom.forEach(document.querySelectorAll(clickTargets), node => {
        node.onclick = e => {
          // Don't do anything if user is selecting text
          if (window.getSelection().toString()) {
            return
          }

          const triggerNode = e.target.closest('.dcs-trigger')
          const triggerId = triggerNode.dataset.dcsTriggerId

          this._selectTriggers(triggerId)

          comToPlugin.postSetDiscourseRoute({
            route: {
              layout: 3,
              pageName: triggerNode.dataset.dcsPageName || pageName,
              triggerId,
              interactMode: triggerNode.dataset.dcsInteractMode
            },
            mode: 'PUSH',
            clientContext: true
          })

          // Mandatory because we want our global click event to fire only
          // when user clicks on an empty space
          e.stopPropagation()
        }
      })

      this.runReady = true

      // Case click nowhere special (all Docuss specific events ar handles
      // elsewhere with preventDefault)

      window.addEventListener('click', () => {
        if (
          this.selTriggerNode &&
          this.selTriggerNode.dataset.dcsHighlightable
        ) {
          this._selectTriggers(null)
          comToPlugin.postSetDiscourseRoute({
            route: { layout: 0, pageName },
            mode: 'PUSH',
            clientContext: true
          })
        }
      })

      // Resize event with debounce
      // https://developer.mozilla.org/en-US/docs/Web/Events/resize#setTimeout
      window.addEventListener('resize', evt => {
        if (this.resizeTimer !== null) {
          clearTimeout(this.resizeTimer)
        }
        this.resizeTimer = setTimeout(() => {
          this.resizeTimer = null
          if (this.selTriggerNode) {
            _scrollIntoViewIfNeeded(this.selTriggerNode)
          }
        }, 100)
      })

      if (this.delayedRoute) {
        this._onDiscourseRoutePushed({ route: this.delayedRoute })
      }
    })
  }

  _onDiscourseRoutePushed({ route, descr, counts, clientContext, origin }) {
    // Case init
    if (this.resolveInit) {
      this.resolveInit({
        descr,
        pageName: route.pageName,
        discourseOrigin: origin,
        counts
      })
      delete this.resolveInit
      this.runReady = false
      this.delayedRoute = route
      return
    }

    // Case we're still not ready
    if (!this.runReady) {
      this.delayedRoute = route
      return
    }

    // Set the route category and title
    if (route.layout === 2 || route.layout === 3) {
      const triggerNode =
        route.triggerId &&
        document.querySelector(
          `.dcs-trigger[data-dcs-trigger-id="${route.triggerId}"]`
        )
      const category =
        (triggerNode && triggerNode.dataset.dcsCategory) ||
        document.documentElement.dataset.dcsCategory
      const discourseTitle =
        (triggerNode && triggerNode.dataset.dcsDiscourseTitle) ||
        document.documentElement.dataset.dcsDiscourseTitle
      comToPlugin.postSetRouteProps({ category, discourseTitle })
    }

    // clientContext === true means that this route changed has been
    // triggered by us, so there is nothing more we need to do (because the
    // trigger is already selected)
    if (!clientContext) {
      this._selectTriggers(route.triggerId)
    }
  }

  // Remember there can be more than one trigger per triggerId
  _selectTriggers(triggerId) {
    if (!this.runReady) {
      throw new Error('should be ready')
    }

    // Unselect everything
    this.selTriggerNode = null
    u.dom.forEach(document.getElementsByClassName('dcs-highlighted'), node =>
      node.classList.remove('dcs-highlighted')
    )

    // Case there is nothing to select
    if (!triggerId) {
      return
    }

    // Look for the trigger node in the DOM
    const triggerNodes = document.querySelectorAll(
      `.dcs-trigger[data-dcs-trigger-id="${triggerId}"]`
    )

    // Case tag not found
    if (!triggerNodes.length) {
      comToPlugin.postSetRouteProps({ error })
      return
    }

    // Highlight the trigger and subsec nodes
    u.dom.forEach(triggerNodes, node => {
      if (node.dataset.dcsHighlightable) {
        node.classList.add('dcs-highlighted')
        const subsec = node.closest('.dcs-subsec')
        subsec && subsec.classList.add('dcs-highlighted')
      }
    })

    // Bring the first trigger node into view
    // THIS IS REQUIRED WHEN LAYOUT HAS CHANGED, BUT ALSO WHEN USING THE BACK
    // BUTTON TO A PREVIOUSLY SELECTED HEADING FAR AWAY
    // Need a setTimeout, to ensure the layout change has occurred.
    // 200 is the iframes animation duration + 30 for security
    // +300 because some web sites (ex: VueJS API) have an animation when layout
    // changes from narrow to wide screen.
    this.selTriggerNode = triggerNodes[0]
    setTimeout(() => _scrollIntoViewIfNeeded(this.selTriggerNode), 700)
  }
}

//------------------------------------------------------------------------------

function _scrollIntoViewIfNeeded(target) {
  const rect = target.getBoundingClientRect()
  // https://stackoverflow.com/a/22480938/3567351
  const isPartiallyVisible = rect.top < window.innerHeight && rect.bottom >= 0
  if (!isPartiallyVisible) {
    target.scrollIntoView() // Set the element top to be at the top of the screen
    window.scrollBy(0, -50) // Lower it a little bit
  }
}

//------------------------------------------------------------------------------

export const htmlBased = new HtmlBased()

//------------------------------------------------------------------------------
