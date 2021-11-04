// ----- 變數 -----
// api data
let KhRouteData = []
let KhEstimateTimeData = []
let KhStopData = []
// temp variable
let selectRouteZh = ''

// Filter
const keywordSearch = document.querySelector('.filter__search')
const filterRouteListContainer = document.querySelector('.filter__listContainer')
const filterRouteList = document.querySelector('.filter__routeList')
// Render list
const routeList = document.querySelectorAll('.routeList')
const forthRouteList = document.querySelector('.forthRouteList')
const backRouteList = document.querySelector('.backRouteList')
const switchList = document.querySelector('.switch')
const switchBtn = document.querySelectorAll('.switch__btn')
const switchForthBtn = document.querySelector('.switch__btn--forth')
const switchBackBtn = document.querySelector('.switch__btn--back')

// ----- API base -----
const apiBusRequest = axios.create({
  baseURL: 'https://ptx.transportdata.tw/MOTC/v2/Bus',
  headers: GetAuthorizationHeader()
})
// API 取得高雄市公車 路線資料
const apiKhRouteGet = () => apiBusRequest.get(`/Route/City/Kaohsiung?$format=JSON`)
// API 取得高雄市公車 預估到站時間資料
const apiEstimateTimeGet = () => apiBusRequest.get(`/EstimatedTimeOfArrival/City/Kaohsiung/${selectRouteZh}?$format=JSON`)
// API 取得高雄市公車 站序資料
const apiStopRouteGet = () => apiBusRequest.get(`/StopOfRoute/City/Kaohsiung?$format=JSON`)

// ----- Filter 公車路線關鍵字搜尋 -----
async function apiDataGet() {
  try {
    const apiKhRouteGetRes = await apiKhRouteGet()
    // const apiEstimateTimeGetRes = await apiEstimateTimeGet()
    const apiStopRouteGetRes = await apiStopRouteGet()
    KhRouteData = apiKhRouteGetRes.data
    // KhEstimateTimeData = apiEstimateTimeGetRes.data
    KhStopData = apiStopRouteGetRes.data
    console.log('KhRouteData, KhEstimateTimeData, KhStopData 資料載入完畢')
    runTask()
  }
  catch (err) {
    console.error(err)
  }
}
apiDataGet() // 執行

function runTask() {

  // temp variable
  let keyword = ''
  // filter data
  let estMatchData = []
  let estForthData = []
  let estBackData = []
  let stopMatchData = []
  let stopForthData = []
  let stopBackData = []

  let combinedForthData = []
  let combinedData = []

  // (效能待優化)
  // ----- 關鍵字篩選列表渲染 -----
  function filterKeywordSearch(e) {
    let routeItem = ''
    keyword = e.target.value
    const regex = new RegExp(keyword)
    KhRouteData.forEach(item => {
      let routeName = item['RouteName']['Zh_tw']
      if (regex.test(routeName)) {
        routeItem += `
        <li class="filter__routeItem">
          <div
            class="filter__routeBtn"
            role="button"
          >${item['RouteName']['Zh_tw']}</div>
        </li>
        `
      }
    })
    if (keyword) filterRouteListContainer.classList.add('active')
    else filterRouteListContainer.classList.remove('active')
    filterRouteList.innerHTML = routeItem
  }

  // 點擊公車路線後 Task
  async function renderTask(e) {
    try {
      // 點擊儲存公車路線字串
      saveRoute(e)
      // 往/返按鈕初始化樣式
      defaultDirectionBtn()
      // 取得 公車預估到站資料
      const apiEstimateTimeGetRes = await apiEstimateTimeGet()
      KhEstimateTimeData = apiEstimateTimeGetRes.data
      estDataMatchRouteName()
      estForthDataFilter()
      estBackDataFilter()
      stopMatchDataFilter()
      combinedForthDataHandler()
      combinedBackDataHandler()
      // 渲染畫面
      forthListRender()
      backListRender()
    }
    catch (err) {
      console.error(err)
    }
  }

  // 點擊公車路線後 => 儲存公車路線字串 'RouteName' > 'Zh_tw'
  function saveRoute(e) {
    if (!e.target.classList.contains('filter__routeBtn')) return
    selectRouteZh = e.target.textContent
    console.log(`查詢: ${selectRouteZh} 路線資料`)
  }

  // (Estimated Time) 找出完全符合 selectRouteZh 的資料
  function estDataMatchRouteName() {
    estMatchData = KhEstimateTimeData.filter(item => item['RouteName']['Zh_tw'] === selectRouteZh)
    console.log('完全符合的預估到站時間資料: ', estMatchData)
  }

  // (Estimated Time) 完全符合 selectRouteZh 的資料 => 去程資料 Direction = 0
  function estForthDataFilter() {
    estForthData = estMatchData.filter(item => item['Direction'] === 0)
    console.log('(去程)完全符合的預估到站時間資料: ', estForthData)
  }

  // (Estimated Time) 完全符合 selectRouteZh 的資料 => 返程資料 Direction = 1
  function estBackDataFilter() {
    estBackData = estMatchData.filter(item => item['Direction'] === 1)
    console.log('(返程)完全符合的預估到站時間資料: ', estBackData)
  }

  // (Stop of Route) 找出完全符合 selectRouteZh 的資料
  function stopMatchDataFilter() {
    stopMatchData = KhStopData.filter(item => item['RouteName']['Zh_tw'] === selectRouteZh)
    console.log('完全符合的站序資料: ', stopMatchData)
    stopForthData = stopMatchData[0]['Stops']
    stopBackData = stopMatchData[1]['Stops']
  }

  function stopStatusTextHandler(status) {
    switch (status) {
      case 0:
        statusText = '正常'
        break
      case 1:
        statusText = '尚未發車'
        break
      case 2:
        statusText = '交管不停靠'
        break
      case 3:
        statusText = '末班車已過'
        break
      case 4:
        statusText = '今日未營運'
        break
      default:
        statusText = '未知'
    }
    return statusText
  }

  function parseDateTime(time) {
    if (!time) return '––'
    let parseTime = Date.parse(time)
    let getDate = new Date(parseTime)
    let nextBusHour = getDate.getHours()
    let nextBusMin = getDate.getMinutes()
    nextBusMin = nextBusMin < 10 ? '0' + nextBusMin : nextBusMin
    let nextBusTime = `${nextBusHour}:${nextBusMin}`
    return nextBusTime
  }

  function estTimeText(estimateTime) {
    let estimateTimeText = ''
    if (estimateTime === 0) estimateTimeText = '進站中'
    else if (estimateTime <= 2 && estimateTime > 0) estimateTimeText = '即將進站'
    else estimateTimeText = `${estimateTime} 分鐘`
    return estimateTimeText
  }

  function combinedBackDataHandler() {
    stopBackData.forEach(stopBackItem => {
      estBackData.forEach(estBackItem => {
        if (stopBackItem['StopUID'] === estBackItem['StopUID']) {
          stopBackItem['plateNumb'] = estBackItem['PlateNumb'] // 車牌號碼
          stopBackItem['stopStatus'] = estBackItem['StopStatus'] // 車輛對站牌狀態
          stopBackItem['estimateTime'] = estBackItem['EstimateTime'] ? estBackItem['EstimateTime'] : '' // 預估到站時間
          stopBackItem['nextBusTime'] = parseDateTime(estBackItem['NextBusTime'])
          stopBackItem['stopStatusText'] = stopStatusTextHandler(estBackItem['StopStatus'])
        }
      })
    })
    console.log('(返程)組合站序資料', stopBackData)
  }

  function combinedForthDataHandler() {
    stopForthData.forEach(stopForthItem => {
      estForthData.forEach(estForthItem => {
        if (stopForthItem['StopUID'] === estForthItem['StopUID']) {
          stopForthItem['plateNumb'] = estForthItem['PlateNumb'] // 車牌號碼
          stopForthItem['stopStatus'] = estForthItem['StopStatus'] // 車輛對站牌狀態
          stopForthItem['estimateTime'] = estForthItem['EstimateTime'] ? estForthItem['EstimateTime'] : '' // 預估到站時間
          stopForthItem['nextBusTime'] = parseDateTime(estForthItem['NextBusTime'])
          stopForthItem['stopStatusText'] = stopStatusTextHandler(estForthItem['StopStatus'])
        }
      })
    })
    console.log('(去程)組合站序資料', stopForthData)
  }

  function forthListRender() {
    let routeItem = ''
    stopForthData.forEach(item => {
      let estimateTime = Math.floor(item['estimateTime'] / 60)
      let estimateTimeText = ''
      if (item['stopStatus'] === 0) estimateTimeText = estTimeText(estimateTime)
      else if (item['stopStatus'] === 1) estimateTimeText = item['nextBusTime']
      else if (item['stopStatus'] > 1) estimateTimeText = '––'

      routeItem += `
      <li class="routeList__item">
        <div class="routeList__mainInfo">
          <div class="routeList__timeLeft">${estimateTimeText}</div>
          <div class="routeList__stopInfo">${item['StopSequence']} / ${item['StopUID']} / ${item['StopName']['Zh_tw']}</div>
        </div>
        <div class="routeList__busID">${item['plateNumb'] ? item['plateNumb'] : item['stopStatusText']}</div>
      </li>
      `
    })
    forthRouteList.innerHTML = routeItem
  }


  function backListRender() {
    let routeItem = ''
    stopBackData.forEach(item => {
      let estimateTime = Math.floor(item['estimateTime'] / 60)
      let estimateTimeText = ''
      if (item['stopStatus'] === 0) estimateTimeText = estTimeText(estimateTime)
      else if (item['stopStatus'] === 1) estimateTimeText = item['nextBusTime']
      else if (item['stopStatus'] > 1) estimateTimeText = '––'

      routeItem += `
      <li class="routeList__item">
        <div class="routeList__mainInfo">
          <div class="routeList__timeLeft">${estimateTimeText}</div>
          <div class="routeList__stopInfo">${item['StopUID']} / ${item['StopName']['Zh_tw']}</div>
        </div>
        <div class="routeList__busID">${item['plateNumb'] ? item['plateNumb'] : item['stopStatusText']}</div>
      </li>
      `
    })
    backRouteList.innerHTML = routeItem
  }

  // ----- 搜尋後預設呈現去程資料、去程按鈕狀態 -----
  function defaultDirectionBtn() {
    switchForthBtn.classList.add('active')
    forthRouteList.classList.add('active')
    switchBackBtn.classList.remove('active')
    backRouteList.classList.remove('active')
  }

  // ----- 切換 去程/返程 按鈕及列表顯示 -----
  function switchDirectionBtn(e) {
    const targetDirect = e.target.dataset.direct
    if (e.target.classList.contains('active')) return
    switchBtn.forEach(item => {
      if (item.dataset.direct === targetDirect) {
        item.classList.add('active')
      } else {
        item.classList.remove('active')
      }
    })

    routeList.forEach(list => {
      if (list.dataset.direct === targetDirect) {
        list.classList.add('active')
      } else {
        list.classList.remove('active')
      }
    })
  }

  // Filter 公車預估到站資料

  // Filter 公車路線站序資料


  // (預備功能) 新增去程、新增倒數更新、手動更新、關鍵字選擇

  // ----- Event Listener -----
  keywordSearch.addEventListener('keyup', filterKeywordSearch, false)
  switchList.addEventListener('click', switchDirectionBtn, false)
  filterRouteList.addEventListener('click', renderTask, false)

}

// ----- API 驗證 (TDX 提供) -----
function GetAuthorizationHeader() {
  var AppID = '298e24d8dcd5462d94df034984044beb';
  var AppKey = 'u2fa9eTpee-g9HdU2diZCLoFDhY';

  var GMTString = new Date().toGMTString();
  var ShaObj = new jsSHA('SHA-1', 'TEXT');
  ShaObj.setHMACKey(AppKey, 'TEXT');
  ShaObj.update('x-date: ' + GMTString);
  var HMAC = ShaObj.getHMAC('B64');
  var Authorization = 'hmac username=\"' + AppID + '\", algorithm=\"hmac-sha1\", headers=\"x-date\", signature=\"' + HMAC + '\"';

  return { 'Authorization': Authorization, 'X-Date': GMTString /*,'Accept-Encoding': 'gzip'*/ }; //如果要將js運行在伺服器，可額外加入 'Accept-Encoding': 'gzip'，要求壓縮以減少網路傳輸資料量
}
