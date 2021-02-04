chrome.storage.sync.get('credentials', async ({ credentials }) => {
  document.body.className = credentials ? 'credentials' : ''
})

window.addEventListener('load', function () {
  document.getElementById('save').addEventListener('click', function () {
    const formData = new FormData(document.querySelector('form'))
    const credentials = {}
    for (const pair of formData.entries()) {
      credentials[pair[0]] = pair[1]
    }

    chrome.storage.sync.set({
      credentials,
    })
  })

  document.getElementById('track').addEventListener('click', async function () {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

    // apiKey and workspaceId are set

    if (!tab.url.match(/https:\/\/task.siteone.cz\/issues\/\d{5,}/)) {
      alert('This extension can be used only for SiteOne Redmine issues')

      return
    }

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['startTimer.js'],
    })
  })
})

