const axios = require('axios')
const Config = require('../config.json')
const chalk = require('chalk')

const BASEURL = 'https://github.com'
const APIHOST = 'https://api.github.com'

async function get (url, authToken) {
    try {
      let res = await axios.get(url, {
          headers: {
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'GSoC-Contribution-Leaderboard',
              'Authorization': 'token ' + Config.authToken
          }
      })
      return new Promise((resolve) => {
        if (res.code === 0) {
          resolve(res)
        } else {
          resolve(res)
        }
      })
    } catch (err) {
        if (err.code === 'ECONNABORTED') {
            console.log(chalk.yellow('[WARNING] Time Out.'))
            return
        }
        if (err.response !== undefined) {
            const message = err.response.data.message
            switch (message) {
                case 'Bad credentials':
                    console.log(chalk.red(('[ERROR] Your GitHub Token is not correct! Please check it in the config.json.')))
                    process.exit()
                    break
                default:
                    console.log(chalk.yellow('[WARNING] ' + message))
            }
        } else {
            console.log(err)
        }
    }
}

async function checkRateLimit() {

    const res = await get(APIHOST + '/rate_limit')

    if (res !== undefined) {
        return res.data.avatar_url
    } else {
        return {}
    }
}

async function getContributorAvatar(contributor) {

    const res = await get(APIHOST + '/users/' + contributor)

    if (res !== undefined) {
        return res.data.avatar_url
    } else {
        return ''
    }
}

async function getOpenPRsCreatedTimes(organization, contributor, page) {
    const OpenPRsURL = `/search/issues?q=is:pr+org:${organization}+author:${contributor}+is:Open&page=${page}&per_page=100`

    const res = await get(APIHOST + OpenPRsURL)

    if (res !== undefined) {
        return res.data.items.map((element)=> {
            return element["created_at"]
        })
    } else {
        return -1
    }
}

async function getMergedPRsCreatedTimes(organization, contributor, page) {
    const MergedPRsURL = `/search/issues?q=is:pr+org:${organization}+author:${contributor}+is:Merged&page=${page}&per_page=100`

    const res = await get(APIHOST + MergedPRsURL)

    if (res !== undefined) {
        return await res.data.items.map((element)=> {
            return element["created_at"]
        })
    } else {
        return -1
    }
}

async function getIssuesCreatedTimes(organization, contributor, page) {
    const IssuesURL = `/search/issues?q=is:issue+org:${organization}+author:${contributor}&page=${page}&per_page=100`

    const res = await get(APIHOST + IssuesURL)

    if (res !== undefined) {
        return res.data.items.map((element)=> {
            return element["created_at"]
        })
    } else {
        return -1
    }
}

async function getContributorInfo(organization, contributor) {
    var openPRsCreatedTimes = [], mergedPRsCreatedTimes = [], issuesCreatedTimes = []
    for(var page =1; page<=3; page++)
    {   
        openPRsCreatedTimes.push(await getOpenPRsCreatedTimes(organization, contributor, page))
        mergedPRsCreatedTimes.push(await getMergedPRsCreatedTimes(organization, contributor, page))
        issuesCreatedTimes.push(await getIssuesCreatedTimes(organization, contributor, page))
    }
    openPRsCreatedTimes = openPRsCreatedTimes.flat()
    mergedPRsCreatedTimes = mergedPRsCreatedTimes.flat()
    issuesCreatedTimes = issuesCreatedTimes.flat()
    const home = BASEURL + '/' + contributor
    const avatarUrl = await getContributorAvatar(contributor)
    const openPRsLink = `${BASEURL}/pulls?q=is:pr+org:${organization}+author:${contributor}+is:open`
    const mergedPRsLink = `${BASEURL}/pulls?q=is:pr+org:${organization}+author:${contributor}+is:merged`
    const issuesLink = `${BASEURL}/issues?q=is:issue+org:${organization}+author:${contributor}`

    return {
        home,
        avatarUrl,
        openPRsCreatedTimes,
        openPRsLink,
        mergedPRsCreatedTimes,
        mergedPRsLink,
        issuesCreatedTimes,
        issuesLink
    }
}

module.exports = {
    getContributorAvatar,
    getOpenPRsCreatedTimes,
    getMergedPRsCreatedTimes,
    getIssuesCreatedTimes,
    getContributorInfo,
    checkRateLimit
}
