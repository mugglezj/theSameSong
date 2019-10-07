/**
 * Created by zj-db0818 on 2017/11/26.
 */
const crawlMeta = require('./crawlMeta');
const timeout = require('../libs/timeout');
const axios = require('axios');
const service = axios.create({
  headers: {
    'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1',
    referer: 'https://m.y.qq.com/'
  }
});

class qqCrawl extends crawlMeta {
  constructor(curPage, songNum) {
    super();
    this.curPage = curPage;
    this.songNum = songNum;
  }

  async fetchData(name = '孙燕姿') {
    this.url = `https://c.y.qq.com/soso/fcgi-bin/client_search_cp?ct=24&qqmusic_ver=1298&new_json=1&remoteplace=sizer.yqq.song_next&searchid=151387985106450562&t=0&aggr=1&cr=1&catZhida=1&lossless=0&flag_qc=0&p=${this.curPage}&n=${this.songNum}&w=${this.encode(name)}&g_tk=162512859&loginUin=0&hostUin=0&format=json&inCharset=utf8&outCharset=utf-8&notice=0&platform=yqq&needNewCode=0`;
    // const result = await axios.get(this.url)
    const [err, symbol, result] = await timeout(axios.get(this.url), 3000);
    if (symbol) {
      console.log('fetchData => timeout');
      fetchData(name);
    } else if (err) {
      console.log(err);
    } else {
      const songs = await this.getSongsArray(result.data);
      // console.log(songs)
      return songs;
    }
  }

  async getSongsArray(data) {
    const songList = data.data.song.list;
    const keySongs = songList.map(v => {
      // console.log(v)
      const url = v.pay.pay_play ? '' : this.getOneSongUrl(v.mid);
      return {
        singer: v.singer.map(singer => singer.name).join(' '),
        name: v.name,
        url: url,
      };
    });
    const urls = await Promise.all(keySongs.map(v => v.url));
    urls.forEach((v, i) => {
      keySongs[i].url = urls[i];
    });
    return keySongs;
  }

  async getOneSongUrl(mid) {
    const tempstamp = Date.now();
    let defaultHeader = {
      authority: 'c.y.qq.com',
      path: 'musichall/fcgi-bin/fcg_yqqhomepagerecommend.fcg?g_tk=5381&uin=0&format=json&inCharset=utf-8&outCharset=utf-8&notice=0&platform=h5&needNewCode=1&_=' + tempstamp,
      scheme: 'https',
      accept: 'application/json',
      'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'cache-control': 'no-cache',
      cookie: 'pgv_pvi=9065962496; pt2gguin=o1363693666; RK=nrwYgZLwf/; ptcz=fa62884057b1c65cf49abe3c3a59b4f496ab6b17da920c7d6d588e66bd50cdbc; pgv_pvid=8204344632; o_cookie=1363693666; tvfe_boss_uuid=4ba3dd3005b46f75; luin=o1363693666; lskey=00010000453ad87b261a19bddfcbbd9cc94d7809423cf25a85f37f25f04f7d78af40e82fc6de0f8f02fc4e42; pgv_info=ssid=s4431621626; yqq_stat=0; ts_uid=130901620; pgv_si=s8776760320; ts_refer=ADTAGmyqq',
      dnt: '1',
      origin: 'https://m.y.qq.com',
      pragma: 'no-cache',
      'Content-Type': 'application/json'
    };
    let qqMusicUrlBaseUrl = 'https://u.y.qq.com';
    let  res = await service({
      url: `${qqMusicUrlBaseUrl}/cgi-bin/musicu.fcg`,
      headers: defaultHeader,
      method: 'POST',
      data: {
        req_0: {
          module: 'vkey.GetVkeyServer',
          method: 'CgiGetVkey',
          param: {
            guid: '5579254314',
            songmid: mid.split(','),
            songtype: [],
            uin: '',
            loginflag: 1,
            platform: '23',
            h5to: 'speed'
          }
        },
        comm: {
          g_tk: 1679324996, uin: '', format: 'json', ct: 23, cv: 0
        }
      }
    });

    console.log('===============');
    console.log('a=');
    console.log(res.data);
    // let data = JSON.parse(res.data);
    let data = res.data
    console.log(data);

    let { req_0: { data: { midurlinfo, sip: [, baseUrl] } } } = data
    console.log(baseUrl);
    const songUrlList = midurlinfo.map((song) => {
      const { purl } = song
      return `${baseUrl}/${purl}`
    })
    return songUrlList[0];


    const url = `https://c.y.qq.com/v8/fcg-bin/fcg_play_single_song.fcg?songmid=${mid}&tpl=yqq_song_detail&format=json&callback=getOneSongInfoCallback&g_tk=5381&jsonpCallback=getOneSongInfoCallback&loginUin=0&hostUin=0&format=json&inCharset=utf8&outCharset=utf-8&notice=0&platform=yqq&needNewCode=0`;
    // const result = await axios.get(url)
    const [err, symbol, result] = await timeout(axios.get(url), 6000);
    if (symbol) {
      console.log('getOneSongUrl => timeout');
      getOneSongUrl(uid);
    } else if (err) {
      console.log(err);
    } else {
      const [realUrl] = Object.values(result.data.url);
      // const test = axios.get(`http://${realUrl}`)
      // todo 在这里判断 realUrl 是否会被 forbidden, 从而决定是否获取另一个 url
      // 目前暂时都是获取第二个地址
      const filename = realUrl.match(/qq\.com\/(\w+)\.m4a/)[1];
      const anotherRealUrl = await this.getAnotherSongUrl(mid, filename);
      return anotherRealUrl;
    }
  }

  async getAnotherSongUrl(mid, filename) {
    const url = `https://c.y.qq.com/base/fcgi-bin/fcg_music_express_mobile3.fcg?g_tk=1976982103&format=json&loginUin=0&hostUin=0&inCharset=utf8&outCharset=utf-8&notice=0&platform=yqq&needNewCode=0&cid=205361747&uin=0&songmid=${mid}&filename=${filename}.m4a&guid=${guid}`;
    // const result = await axios.get(url)
    const [err, symbol, result] = await timeout(axios.get(url), 3000);
    if (symbol) {
      console.log('getAnotherSongUrl => timeout');
      getAnotherSongUrl(mid, filename);
    } else if (err) {
      console.log(err);
    } else {
      const [song] = result.data.data.items;
      console.log(result);
      const {vkey} = song;
      // const realUrl = `dl.stream.qqmusic.qq.com/${filename}.m4a?vkey=${vkey}&guid=${guid}`
      const realUrl = `isure.stream.qqmusic.qq.com/${filename}.m4a?vkey=${vkey}&guid=${guid}&uin=0&fromtag=38`;
      // {"http://isure.stream.qqmusic.qq.com//C400001KvcN22z40N8.m4a?guid=5579254314&vkey=B9DB5E9DEE195E2BD5E81CD006E53F29A1C50BC7DB859C5D17AACCF8E4698AAC8EE93A4EF28DF053063101D0E336B90F00DC61797CDDDE03&uin=0&fromtag=38"}
      return realUrl;
    }
  }
}

module.exports = qqCrawl;
// const qq = new qqCrawl(1, 2)
// qq.fetchData()
