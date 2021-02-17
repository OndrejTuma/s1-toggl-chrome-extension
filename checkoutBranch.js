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
  const projectNode = document.getElementById('projectId')
  const projectId = projectNode ? parseInt(projectNode.innerHTML) : 0

  if (!projectId) {
    alert('Missing project id')

    return
  }

  let workingDir = getProjectworkingDir(projectId, projectWorkingDirs)

  if (!workingDir) {
    workingDir = prompt('Missing project working dir. Add one:')
  }

  if (!workingDir) {
    return
  }

  chrome.storage.sync.set({
    projectWorkingDirs: [
      ...(projectWorkingDirs || []),
      { id: projectId, dir: workingDir },
    ],
  })

  const taskNumber = window.location.toString().replace(/^.*issues\/([0-9]+).*$/, '$1')
  const taskSubjectNode = document.getElementById('issue_subject')

  let taskSubject = taskSubjectNode ? taskSubjectNode.value.replace(new RegExp('^\#\d{5}[\-:, ]*', 'i'), '') : ''

  if (!taskSubject) {
    taskSubject = prompt('Missing task subject. Add taks subject which will be converted to branch name:')
  }

  if (!taskSubject) {
    return
  }

  const branchName = `feat/${taskNumber}/${slugify(taskSubject)}`

  try {
    const res = await fetch('http://localhost:8123/api/branches', {
      method: 'POST',
      body: JSON.stringify({
        branchName,
        workingDir,
      }),
    })

    if (res.status === 400) {

    }

    const resData = await res.json()

    if (resData.success) {
      alert('Branch is ready')
    } else {
      alert('Error occured. Check microservice logs. ' + JSON.stringify(resData, null, 2))
    }
  } catch (e) {
    console.log(e)
  }
})