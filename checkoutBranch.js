function slugify(string) {
  const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;'
  const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------'
  const p = new RegExp(a.split('').join('|'), 'g')

  return string.toString().toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w\-]+/g, '') // Remove all non-word characters
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '') // Trim - from end of text
}

/**
 * @param {number} projectId
 * @param {{id: number, dir: string}[]} projectWorkingDirs
 * @return {string}
 */
function getProjectworkingDir(projectId, projectWorkingDirs) {
  if (!Array.isArray(projectWorkingDirs)) {
    return ''
  }

  const projectworkingDir = projectWorkingDirs.find(({ id }) => id === projectId)

  return projectworkingDir ? projectworkingDir.dir || '' : ''
}


chrome.storage.sync.get('projectWorkingDirs', async ({ projectWorkingDirs }) => {
  const microserviceConfig = {
    url: 'http://localhost',
    port: 8123
  }
  const projectNode = document.getElementById('projectId')
  const projectId = projectNode ? parseInt(projectNode.innerHTML) : 0

  if (!projectId) {
    alert('Missing project id')

    return
  }

  let workingDir = getProjectworkingDir(projectId, projectWorkingDirs)

  if (!workingDir) {
    try {
      const workingDirHandle = await window.showDirectoryPicker()

      workingDir = workingDirHandle.name

      chrome.storage.sync.set({
        projectWorkingDirs: [
          ...(projectWorkingDirs || []),
          { id: projectId, dir: workingDir },
        ],
      })
    } catch (e) {
      return
    }
  }

  const taskNumber = window.location.toString().replace(/^.*issues\/([0-9]+).*$/, '$1')
  const taskSubjectNode = document.getElementById('issue_subject')

  let taskSubject = taskSubjectNode ? taskSubjectNode.value.replace(/\#\d{5}[\-:, ]*/g, '') : ''

  if (!taskSubject) {
    taskSubject = prompt('Missing task subject. Add task subject which will be converted to branch name:')
  }

  if (!taskSubject) {
    return
  }

  const branchName = `feat/${taskNumber}/${slugify(taskSubject)}`

  try {
    const res = await fetch(`${microserviceConfig.url}:${microserviceConfig.port}/api/branches`, {
      method: 'POST',
      body: JSON.stringify({
        branchName,
        workingDir,
      }),
    })

    if (!res.ok) {
      if (res.status === 400) {
        const resData = await res.json()

        alert('Request failed:\n' + resData.message)
      } else {
        alert('Request failed. Check console for more info')
        console.log(res)
      }

      return
    }

    const resData = await res.json()

    if (resData.success) {
      alert('Branch is ready')
    } else {
      alert('Error occured. Check microservice logs. ' + JSON.stringify(resData, null, 2))
    }
  } catch (e) {
    alert(`Server is not responding. Make sure its up and running.\n(${microserviceConfig.url}:${microserviceConfig.port})`)

    console.log(e)
  }
})