import { u } from './utils'
import { comToPlugin } from './comToPlugin'

//==============================================================================
//==============================================================================
//==============================================================================

export { u, comToPlugin }

//==============================================================================
//==============================================================================
//==============================================================================

const TRIGGER_CLICK_TARGETS =
  '.dcs-icons, .dcs-trigger.dcs-no-balloon .dcs-trigger-span, .dcs-trigger.dcs-no-balloon.dcs-no-span'

//==============================================================================
//==============================================================================
//==============================================================================

class HtmlBasedSingleton {
  //----------------------------------------------------------------------------

  constructor() {
    this.selTriggerNode = null
    this.resizeTimer = null
    this.currentRoute = null
    comToPlugin.onDiscourseRoutePushed(this._onDiscourseRoutePushed.bind(this))
    comToPlugin.onCountsChanged(({ counts }) => console.log('counts: ', counts))
  }

  //----------------------------------------------------------------------------

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

  //----------------------------------------------------------------------------

  parseDom({ descr, pageName, discourseOrigin, counts }) {
    // We will resolve all links to absolute without proxy ("https://website.com/bar/index.html")
    // We start by retrieving the url of the current page url without the proxy
    const page = descr.pages.find(p => p.name === pageName)

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
            this._transformLink({ a, descr, discourseOrigin, page })
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
      // Don't deselect when user is selecting text
      if (
        !window.getSelection().toString() &&
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

    return u.dom.onDOMReady().then(() => {
      // Modify the document links so that they open the correct url in the
      // correct place
      u.dom.forEach(document.getElementsByTagName('a'), a => {
        this._transformLink({ a, descr, discourseOrigin, page })
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

  //----------------------------------------------------------------------------

  _onDiscourseRoutePushed({ route, descr, counts, clientContext, origin }) {
    this.currentRoute = route

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

    // clientContext === true means that this route changed has been
    // triggered by us, so there is nothing more we need to do (because the
    // trigger is already selected)
    if (!clientContext) {
      this._selectTriggers(route.triggerId)
    }

    // Set the route category and title
    if (route.layout === 2 || route.layout === 3) {
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

  //----------------------------------------------------------------------------

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

  //----------------------------------------------------------------------------

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

  //----------------------------------------------------------------------------

  // Something to remember here: a.href and a.getAttribute('href') are two very
  // different things:
  // - a.getAttribute('href') is the absolute or relative url the web designer
  // has written in his html code.
  // - a.href is the resulting absolute url computed by the browser from the
  // a.getAttribute('href') and the current page url.
  _transformLink({ a, descr, discourseOrigin, page }) {
    // Case link is empty
    if (
      !a.href ||
      a.href === '#' ||
      a.href === '#!' || // Yes, some people use this for empty links!
      a.href.startsWith('javascript:')
    ) {
      return
    }

    // Remove unsupported targets
    if (a.target === '_parent' || a.target === '_top') {
      delete a.target
    }

    // Transform the "//discourse" placeholder by the full link to the
    // Discourse instance
    if (a.hostname === 'discourse') {
      a.href = new URL(a.pathname + a.search + a.hash, discourseOrigin)
    }

    /*
    There are 3 cases here:

    Case #1: the link points to another page of our website, such as
    http://my.website.com/otherpage.html. In that case we need to modify the 
    link in the DOM to make it point to the Discourse instance, so that 
    "right click + open in a new tab" will behave correctly. Also, in case of 
    single click, we need to cancel the default behavior and ask the Docuss 
    plugin to perform the page change within Discourse.
    WE DON'T SUPPORT LINKS USING A DOCUSS PROXY, such as
    http://docuss.proxy.com/http://my.website.com/otherpage.html

    Case #2: the link is a Discourse link, such as http://my.discourse.com
    or http://my.discourse.com/latest or http://my.discourse.com/docuss/foo.
    There is no need to modify the link in the dom because it is already ok
    for "right click + open in a new tab". However, in case of single click,
    we need to cancel the default behavior and ask the Docuss plugin to
    perform the page change within Discourse.

    Case #3: the link points to an arbitrary external page, such as
    http://google.com. In that case, we just want the link to open in the
    parent window, not the iframe.
    */

    // Look if the link url is in the website page list (case #1)
    const pageUrlWithoutProxy = page.url
    const possibleRelativeLink = a.getAttribute('href').trim()
    const targetUrlNoProxy = new URL(possibleRelativeLink, pageUrlWithoutProxy)
    targetUrlNoProxy.hash = ''
    const websitePage = descr.pages.find(
      p => p.url.split('#')[0] === targetUrlNoProxy.href
    )

    // Case #3
    if (!websitePage && a.origin !== discourseOrigin) {
      if (a.target !== '_blank') {
        a.target = '_parent'
      }
      return
    }

    // Cases #1 and #2
    let route
    if (websitePage) {
      // Case #1
      a.href = discourseOrigin + '/docuss/' + websitePage.name + a.hash
      route = { layout: 0, pageName: websitePage.name, hash: a.hash }
    } else {
      // Case #2 (a.origin === discourseOrigin)
      if (a.pathname.startsWith('/docuss/')) {
        const pageName = a.pathname.substring('/docuss/'.length)
        route = { layout: 0, pageName, hash: a.hash }
      } else if (a.pathname === '/' || a.pathname === '/docuss') {
        // We don't have access to the first website descr, so we cannot
        // compute the target page name. So those 2 lines are very WRONG:
        //    const pageName = descr.pages[0].name
        //    route = { layout: 0, pageName, hash: a.hash }
        // because it would route the user to the first page of the current,
        // descr not the first page of all descr.
        if (a.target !== '_blank') {
          a.target = '_parent'
        }
        return
      } else {
        route = { layout: 1, pathname: a.pathname, hash: a.hash }
      }
    }

    if (a.target === '_blank') {
      return
    }

    // Cases #1 and #2
    a.addEventListener('click', e => {
      if (e.ctrlKey) {
        return
      }

      e.preventDefault()
      e.stopPropagation()

      // Special case when the link is a link to self. On a standard html page,
      // a link to self is supposed to reload the page EXCEPT if there is an
      // anchor, in which case the link acts as if it was a pure anchor link.
      // One thing to take into account here is that the Docuss plugin doesn't
      // support page reloading: if you call postSetDiscourseRoute() with the
      // same route pageName, the page won't reload (but the hash will be set).
      // So what are we gonna do?:
      // - Not reloading the page is ok. I see no point in doing it. Although
      // it could easily be done by setting a.target = '_parent'.
      // - Scroll to the anchor must be taken care of.
      if (route.pageName === page.name) {
        location.hash = a.hash
        const route = Object.assign({}, this.currentRoute, { hash: a.hash })
        comToPlugin.postSetDiscourseRoute({
          route,
          mode: 'REPLACE',
          clientContext: true
        })
      } else {
        comToPlugin.postSetDiscourseRoute({
          route,
          mode: 'PUSH',
          clientContext: true
        })
      }
    })
  }
}

//==============================================================================
//==============================================================================
//==============================================================================

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

//==============================================================================
//==============================================================================
//==============================================================================

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

//==============================================================================
//==============================================================================
//==============================================================================

export const htmlBased = new HtmlBasedSingleton()

//==============================================================================
//==============================================================================
//==============================================================================

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
