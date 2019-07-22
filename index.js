const BASE_URL = 'https://movie-list.alphacamp.io'
const INDEX_URL = BASE_URL + '/api/v1/movies/'
const POSTER_URL = BASE_URL + '/posters/'
// 這裡的data用來存放所有電影資料
const data = []

const dataPanel = document.getElementById('data-panel')

const searchForm = document.getElementById('search')
const searchInput = document.getElementById('search-input')
const searchBtn = document.getElementById('search-btn')

const modeBar = document.getElementById('mode-bar')

const pagination = document.getElementById('pagination')
const ITEM_PER_PAGE = 12

/* 如果呼叫 getPageData 時有電影資料被傳入，就用新傳入的資料作運算，然後 paginationData 會被刷新；如果呼叫 getPageData 時沒有電影資料被傳入，則沿用 paginationData 裡的內容，確保 slice 始終有東西可以處理。 */
let paginationData = []

// 新增: 變數listMode，在listMode為false的情況下會顯示卡片模式，true的情況下顯示清單模式
let listMode = false
// 新增: 變數currentPage，用來偵測現在所在的頁數
let currentPage = 1

/* ---------------------- Data Import ---------------------- */


// import movie information
axios.get(INDEX_URL).then((response) => {
  data.push(...response.data.results)
  getTotalPages(data)
  getPageData(currentPage, data)
}).catch((err) => console.log(err))


/* ---------------------- Event Listeners ---------------------- */


// listen to search form submit event
searchForm.addEventListener('click', event => {
  let results = []
  event.preventDefault()
  const regex = new RegExp(searchInput.value, 'i')
  results = data.filter(movie => movie.title.match(regex))
  console.log(results)
})


// listen to data panel
dataPanel.addEventListener('click', (event) => {
  if (event.target.matches('.btn-show-movie')) {
    showMovie(event.target.dataset.id)
  } else if (event.target.matches('.btn-add-favorite')) {
    addFavoriteItem(event.target.dataset.id)
  }
})


// listen to pagination click event
pagination.addEventListener('click', event => {
  console.log(event.target.dataset.page)
  // 新增: 將頁碼存入currentPage變數
  currentPage = event.target.dataset.page
  // 如果點擊到 a 標籤，則透過將頁碼傳入 getPageData 來切換分頁
  if (event.target.tagName === 'A') {
    getPageData(event.target.dataset.page)
  }
})


// listen to mode buttons
modeBar.addEventListener('click', event => {
  if (event.target.classList.contains('fa-bars')) {
    // 清單模式
    listMode = true
    getTotalPages(data)
    getPageData(currentPage, data)
  } else if (event.target.classList.contains('fa-th')) {
    // 卡片模式
    listMode = false
    getTotalPages(data)
    getPageData(currentPage, data)
  }

})


// listen to search button
searchBtn.addEventListener('click', event => {
  event.preventDefault()

  let results = []
  const regex = new RegExp(searchInput.value, 'i')

  results = data.filter(movie => movie.title.match(regex))
  console.log(results)
  getTotalPages(results)
  getPageData(1, results)
})


/* ---------------------- Functions ---------------------- */


// 新增: 清單模式的排版，依listMode判定，false為卡片模式，反之
function displayDataList(data) {
  let htmlContent = ''
  data.forEach(function (item, index) {
    if (!listMode) {
      // 卡片模式
      htmlContent += `
          <div class="col-sm-3">
            <div class="card mb-2">
              <img class="card-img-top " src="${POSTER_URL}${item.image}" alt="Card image cap">
              <div class="card-body movie-item-body">
                <h6 class="card-title">${item.title}</h5>
              </div>

              
              <div class="card-footer">
                <!-- "More" button -->
                <button class="btn btn-primary btn-show-movie" data-toggle="modal" data-target="#show-movie-modal" data-id="${item.id}">More</button>
                <!-- favorite button -->
                <button class="btn btn-info btn-add-favorite" data-id="${item.id}">+</button>
              </div>
            </div>
          </div>
        `
    } else {
      // 新增: 清單模式，用bootstrap table排版；在<td>標籤套上padding-right讓所有表格的按鈕對齊排列並盡可能響應螢幕大小
      htmlContent += `
      <table class="table">
        <tbody>
          <tr>
            <th scope="row">${item.title}</th>
            <td id="list-mode-button" class="text-right" style="padding-right: 15vw">
              <button class="btn btn-primary btn-show-movie" data-toggle="modal" data-target="#show-movie-modal" data-id="${item.id}">More</button>
              <button class="btn btn-info btn-add-favorite" data-id="${item.id}">+</button>
            </td>
          </tr>
        </tbody>
      </table>
    `
    }
  })
  dataPanel.innerHTML = htmlContent
}


// show movie detail clicked in modal
function showMovie(id) {
  // get elements
  const modalTitle = document.getElementById('show-movie-title')
  const modalImage = document.getElementById('show-movie-image')
  const modalDate = document.getElementById('show-movie-date')
  const modalDescription = document.getElementById('show-movie-description')

  // set request url
  const url = INDEX_URL + id
  console.log(url)

  // send request to show api
  axios.get(url).then(response => {
    // 這裡的data用來存放modal顯示所需的資料
    const data = response.data.results
    console.log(data)

    // insert data into modal ui
    modalTitle.textContent = data.title
    modalImage.innerHTML = `<img src="${POSTER_URL}${data.image}" class="img-fluid" alt="Responsive image">`
    modalDate.textContent = `release at : ${data.release_date}`
    modalDescription.textContent = `${data.description}`
  })
}


function addFavoriteItem(id) {
  // JSON.parse(localStorage.getItem('favoriteMovies'))回傳一個存放使用者收藏過電影資料的陣列
  // 在最一開始localStorage會是空的(null)，null || [] (false || true) 回傳true 也就是 list = []
  const list = JSON.parse(localStorage.getItem('favoriteMovies')) || []
  // data.find從電影總表中找出 id 符合條件的電影並將回傳結果存入movie
  // data是index.js程式碼最上方用來存放電影資料的常數
  const movie = data.find(item => item.id === Number(id))

  // 迭代list並以id判斷是否已存在於list(也就是已經被使用者按過收藏)
  // 如果有就會警告使用者已新增過該電影並不進行任何動作
  if (list.some(item => item.id === Number(id))) {
    alert(`${movie.title} is already in your favorite list.`)
  } else {
    // 每被判定未被收藏過的電影會被加進list陣列中
    list.push(movie)
    alert(`Added ${movie.title} to your favorite list!`)
  }
  // 將list的資料存放至localStorage的'favoriteMovies'中
  // setItem會直接取代localStorage中'favoriteMovies'內的值
  localStorage.setItem('favoriteMovies', JSON.stringify(list))
}


// 計算總頁數並演算 li.page-item
function getTotalPages(data) {
  // 把 Array 的長度除以 ITEM_PER_PAGE(值為12)
  let totalPages = Math.ceil(data.length / ITEM_PER_PAGE) || 1
  let pageItemContent = ''
  for (let i = 0; i < totalPages; i++) {
    // 實務上會加入像 "javascript:;" 之類的字串，註明這個 a 標籤會觸發 JavaScript 程式。
    // data-page屬性讓函式讀取用
    pageItemContent += `
        <li class="page-item">
          <a class="page-link" href="javascript:;" data-page="${i + 1}">${i + 1}</a>
        </li>
      `
  }
  pagination.innerHTML = pageItemContent
}


// 運算需要取出的資料，然後將取出的資料傳給 displayDataList()，渲染到頁面上。
// 藉由找到 data Array 中的第 (頁碼 - 1) * 12 項，再從該位置往後取出 12 筆資料
// 新增: 於卡片模式及清單模式呼叫getPageData時會直接將currentPage作為引數代入pageNum
function getPageData(pageNum, data) {
  paginationData = data || paginationData
  let offset = (pageNum - 1) * ITEM_PER_PAGE
  // 印出每頁資料用的變數
  let pageData = paginationData.slice(offset, offset + ITEM_PER_PAGE)
  // 展示每頁電影的函式
  displayDataList(pageData)
}