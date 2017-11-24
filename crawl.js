const fs = require('fs')
const axios = require('axios')

const curPage = 1
const songNum = 12

function encode(str) {
    return encodeURIComponent(str)
}
async function request(url) {
    const result = await axios.get(url)
    const ptn = /(\{.*\})/gi
    const data = JSON.parse(result.data.match(ptn)[0])
    return data
}
async function fetchData(name = '林俊杰') {
    const url = `https://c.y.qq.com/soso/fcgi-bin/client_search_cp?ct=24&qqmusic_ver=1298&new_json=1&remoteplace=sizer.yqq.song_next&searchid=151387985106450562&t=0&aggr=1&cr=1&catZhida=1&lossless=0&flag_qc=0&p=${curPage}&n=${songNum}&w=${encode(name)}&g_tk=162512859&jsonpCallback=searchCallbacksong8555&loginUin=0&hostUin=0&format=jsonp&inCharset=utf8&outCharset=utf-8&notice=0&platform=yqq&needNewCode=0`
    const data = await request(url)
    const songs = await getSongsArray(data)
    return songs
}
async function getSongsArray(data) {
    const songList = data.data.song.list
    const keySongs = songList.map(v => {
        return {
            singer: v.singer.map(singer => singer.name).join(' '),
            name: v.name,
            mid: v.mid
        }
    })
    const arr = []
    for (const song of keySongs) {
        arr.push(await getOneSongUrl(song))
    }
    return arr
}
async function getOneSongUrl(song) {
    const url = `https://c.y.qq.com/v8/fcg-bin/fcg_play_single_song.fcg?songmid=${song.mid}&tpl=yqq_song_detail&format=jsonp&callback=getOneSongInfoCallback&g_tk=5381&jsonpCallback=getOneSongInfoCallback&loginUin=0&hostUin=0&format=jsonp&inCharset=utf8&outCharset=utf-8&notice=0&platform=yqq&needNewCode=0`
    const data = await request(url)
    const realUrl = Object.values(data.url)[0]
    const one = {
        name: song.name,
        url: realUrl,
        singer: song.singer
    }
    return one
}

module.exports = fetchData
// fetchData()
