// ----- 變數 -----
let KhRouteData = []
let KhEstimateTimeData = []
let KhStopData = []

let filterObj = {}
let busData = []
let forthData = []
let backData = []

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
const apiEstimateTimeGet = () => apiBusRequest.get(`/EstimatedTimeOfArrival/City/Kaohsiung/301?$format=JSON`)
// API 取得高雄市公車 站序資料
const apiStopRouteGet = () => apiBusRequest.get(`/StopOfRoute/City/Kaohsiung?$format=JSON`)

// ----- Filter 公車路線關鍵字搜尋 -----
async function apiDataGet() {
  try {
    const apiKhRouteGetRes = await apiKhRouteGet()
    const apiEstimateTimeGetRes = await apiEstimateTimeGet()
    const apiStopRouteGetRes = await apiStopRouteGet()
    KhRouteData = apiKhRouteGetRes.data
    KhEstimateTimeData = apiEstimateTimeGetRes.data
    KhStopData = apiStopRouteGetRes.data
    console.log('資料載入完畢')
    runTask()
  }
  catch (err) {
    console.error(err)
  }
}
apiDataGet() // 執行

function runTask() {

  // (效能待優化)
  let keyword = ''
  function filterKeywordSearch(e) {
    let str = ''
    keyword = e.target.value
    const regex = new RegExp(keyword)
    KhRouteData.forEach(item => {
      let routeName = item['RouteName']['Zh_tw']
      if (regex.test(routeName)) {
        str += `
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
    filterRouteList.innerHTML = str
  }

  function renderRoute(e) {
    if (e.target.classList.contains(''))
      console.log(e)
  }

  // ----- 搜尋後預設呈現去程資料、去程按鈕狀態 -----
  function defaultDirectionBtn() {
    switchForthBtn.classList.add('active')
    forthRouteList.classList.add('active')
    switchBackBtn.classList.remove('active')
    backRouteList.classList.remove('active')
  }

  // ----- 切換 往/返 按鈕及列表顯示 -----
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
  filterRouteList.addEventListener('click', renderRoute, false)

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
