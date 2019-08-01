import { u } from './utils'
import { comToPlugin } from './comToPlugin'

//------------------------------------------------------------------------------

export { u, comToPlugin }

//------------------------------------------------------------------------------

const TRIGGER_CLICK_TARGETS =
  '.dcs-icons, .dcs-trigger.dcs-no-balloon .dcs-trigger-span, .dcs-trigger.dcs-no-balloon.dcs-no-span'

//------------------------------------------------------------------------------

class HtmlBasedSingleton {
  constructor() {
    this.selTriggerNode = null
    this.resizeTimer = null
    comToPlugin.onDiscourseRoutePushed(this._onDiscourseRoutePushed.bind(this))
    comToPlugin.onCountsChanged(({ counts }) => console.log('counts: ', counts))
  }

  connect({ discourseOrigin, timeout }) {
    return new Promise((resolve, reject) => {
      // Establish communication with the Discourse plugin
      this.resolveConnect = resolve
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

    // Attempt to support more dynamic websites: manage links and trigger that
    // are added later through javascript
    new MutationObserver(mutationsList => {
      for (let mutation of mutationsList) {
        for (let addedNode of mutation.addedNodes) {
          // We are interested about nodes only (not text, etc.)
          if (addedNode.nodeType !== Node.ELEMENT_NODE) {
            return
          }

          // Go through added links
          const links = [
            ...(addedNode.tagName === 'A' ? [addedNode] : []),
            ...addedNode.getElementsByTagName('A')
          ]
          for (let a of links) {
            console.log(
              'Docuss experimental feature: a link has been dynamically added',
              a
            )
            _transformLink({ a, descr, discourseOrigin, pageUrlWithoutProxy })
          }

          // Go through added click targets
          const targets = [
            ...(addedNode.matches(TRIGGER_CLICK_TARGETS) ? [addedNode] : []),
            ...addedNode.querySelectorAll(TRIGGER_CLICK_TARGETS)
          ]
          for (let t of targets) {
            // Case a trigger target has been dynamically added
            console.log(
              'Docuss experimental feature: a trigger target has been dynamically added',
              t
            )
            this._addTriggerClickEvent({ node: t, pageName })
          }

          // Check if triggers have been added
          const triggers = [
            ...(addedNode.classList.contains('dcs-trigger') ? [addedNode] : []),
            ...addedNode.getElementsByClassName('dcs-trigger')
          ]
          if (triggers.length) {
            // Case one or several trigger nodes have been dynamically added
            console.log(
              'Docuss experimental feature: one or several triggers have been dynamically added',
              triggers
            )
            _setAdditionalRedirects()
          }
        }
      }
    }).observe(document.documentElement, { childList: true, subtree: true })

    // Case click nowhere special (all Docuss specific events ar handles
    // elsewhere with preventDefault)
    window.addEventListener('click', () => {
      if (this.selTriggerNode && this.selTriggerNode.dataset.dcsHighlightable) {
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

    return u.dom.onDOMReady().then(() => {
      // Modify the document links so that they open the correct url in the
      // correct place
      u.dom.forEach(document.getElementsByTagName('a'), a => {
        _transformLink({ a, descr, discourseOrigin, pageUrlWithoutProxy })
      })

      // Add click events on triggers
      u.dom.forEach(document.querySelectorAll(TRIGGER_CLICK_TARGETS), node => {
        this._addTriggerClickEvent({ node, pageName })
      })

      // Set the additional redirects
      _setAdditionalRedirects()

      this.runReady = true

      if (this.delayedRoute) {
        this._onDiscourseRoutePushed({ route: this.delayedRoute })
      }
    })
  }

  _onDiscourseRoutePushed({ route, descr, counts, clientContext, origin }) {
    // Case init
    if (this.resolveConnect) {
      this.resolveConnect({
        descr,
        pageName: route.pageName,
        discourseOrigin: origin,
        counts
      })
      delete this.resolveConnect
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
      // clientContext === true means that this route changed has been
      // triggered by us, so there is nothing more we need to do (because the
      // trigger is already selected)
      if (!clientContext) {
        this._selectTriggers(route.triggerId)
      }

      // Set the route props
      const category =
        (this.selTriggerNode && this.selTriggerNode.dataset.dcsCategory) ||
        document.documentElement.dataset.dcsCategory
      const discourseTitle =
        (this.selTriggerNode &&
          this.selTriggerNode.dataset.dcsDiscourseTitle) ||
        document.documentElement.dataset.dcsDiscourseTitle
      comToPlugin.postSetRouteProps({ category, discourseTitle })
    }
  }

  _addTriggerClickEvent({ node, pageName }) {
    node.addEventListener('click', e => {
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
    })
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

    // Go through selected nodes
    this.selTriggerNode = null
    u.dom.forEach(triggerNodes, node => {
      // Is it a highlightable trigger node?
      if (node.dataset.dcsHighlightable) {
        // Highlight the trigger nodes
        node.classList.add('dcs-highlighted')

        // Highlight the subsec nodes
        const subsec = node.closest('.dcs-subsec')
        subsec && subsec.classList.add('dcs-highlighted')

        // Set one node as the selected one, with priority given to the first
        // dcsHighlightable one. THIS IS IMPORTANT: the selected node must be a
        // dcsHighlightable one for the default click handler to work correctly.
        this.selTriggerNode = this.selTriggerNode || node
      }
    })

    // Case no dcsHighlightable has been found: take the first node
    this.selTriggerNode = this.selTriggerNode || triggerNodes[0]

    // Bring the selected node into view
    // THIS IS REQUIRED WHEN LAYOUT HAS CHANGED, BUT ALSO WHEN USING THE BACK
    // BUTTON TO A PREVIOUSLY SELECTED HEADING FAR AWAY
    // Need a setTimeout, to ensure the layout change has occurred.
    // 200 is the iframes animation duration + 30 for security
    // +300 because some web sites (ex: VueJS API) have an animation when layout
    // changes from narrow to wide screen.
    setTimeout(() => _scrollIntoViewIfNeeded(this.selTriggerNode), 700)
  }
}

//------------------------------------------------------------------------------

function _scrollIntoViewIfNeeded(target) {
  const rect = target.getBoundingClientRect()
  // https://stackoverflow.com/a/22480938/3567351
  const isPartiallyVisible = rect.top < window.innerHeight && rect.bottom >= 0
  if (!isPartiallyVisible) {
    // Scroll the element to the top of the window
    target.scrollIntoView()

    // Lower it a little bit, so that there is a nice margin between the element
    // and the top of the window.
    // NO, DON'T DO THAT! Suppose the element is at the bottom of the page: it
    // cannot be scrolled to the top, so lowering it will make it disappear!
    //window.scrollBy(0, -50)
  }
}

//------------------------------------------------------------------------------

function _transformLink({ a, descr, discourseOrigin, pageUrlWithoutProxy }) {
  // Case link is empty
  if (
    !a.href ||
    a.href === '#' ||
    a.href === '#!' || // Yes, some people use this for empty links!
    a.href.startsWith('javascript:')
  ) {
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
    a.addEventListener('click', e => {
      e.preventDefault()
      e.stopPropagation()
      comToPlugin.postSetDiscourseRoute({
        route: { layout: 1, pathname: a.pathname },
        mode: 'PUSH',
        clientContext: true
      })
    })
    return
  }

  const targetUrlNoHash = a.href.split('#')[0]

  // Case it is an anchor (internal link)
  if (a.hash && targetUrlNoHash === pageUrlWithoutProxy.split('#')[0]) {
    // We need to notify the parent window AND keep the default anchor behavior
    a.addEventListener('click', () => {
      comToPlugin.postSetHash({ hash: a.hash, mode: 'REPLACE' })
    })
    return
  }

  // Case it is an external link or a link to self

  // See if there is a corresponding page in the website
  const page = descr.pages.find(p => p.url.split('#')[0] === targetUrlNoHash)

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
    a.addEventListener('click', e => {
      e.preventDefault()
      e.stopPropagation()
      comToPlugin.postSetDiscourseRoute({
        route: { layout: 0, pageName: page.name },
        mode: 'PUSH',
        clientContext: true
      })
    })
  }
}

//------------------------------------------------------------------------------

function _setAdditionalRedirects() {
  // Remember that a same triggerId can have several node with different
  // dcsHighlightable property value. So we consider a trigger as
  // highligthable if any of its nodes is highligthable
  const nodes = document.getElementsByClassName('dcs-trigger')
  const highlightables = {}
  u.dom.forEach(nodes, node => {
    const triggerId = node.dataset.dcsTriggerId
    highlightables[triggerId] =
      highlightables[triggerId] || !!node.dataset.dcsHighlightable
  })
  const nonHighlitghables = Object.keys(highlightables).filter(
    id => !highlightables[id]
  )

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
}

//------------------------------------------------------------------------------

export const htmlBased = new HtmlBasedSingleton()

//------------------------------------------------------------------------------

/*
setTimeout(() => {
  const a1 = u.dom.createElement(`<div><a href="DISCOURSE/latest">Link1 - Latest</a></div>`)
  document.body.appendChild(a1)

  const t = u.dom.createElement(`
    <div>
      <div style="padding: 10px 0px" data-dcs-trigger-id="photos" data-dcs-interact-mode="COMMENT" data-dcs-discourse-title="Additional" data-dcs-highlightable="true" class="dcs-trigger">
        <span class="dcs-trigger-span">Photos 2</span>
        <span class="dcs-icons">
          <div class="dcs-balloon"></div>
        </span>
      </div>
    </div>
  `)
  document.body.appendChild(t)

  const a2 = u.dom.createElement(`<a href="index.html">Link2 - Home</a>`)
  document.body.appendChild(a2)
}, 5000)
*/
