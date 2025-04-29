// --- 전역 변수 및 데이터 로딩 ---
let lastSelectedId = null;
let input_min_budget = 1000;
let input_max_budget = 1500;
let input_days = 7;
let lasebudget = 0;

let touristData = {};
let countryBudgetData = {};
let capitalData = {};
const contry_id = [];

const apiKey = 'Open trip api key';

// 국가 중심 좌표 (필요시 확장)
const countryCenters = {
  KR: { name: "seoul", lat: 37.5665, lon: 126.9780 },
  JP: { name: "tokyo", lat: 35.6895, lon: 139.6917 },
  BZ: { name: "belmopan", lat: 17.2514, lon: -88.7669 },
  // ... 추가
};

// --- 데이터 로드 ---
Promise.all([
  fetch('assets/tourist.json').then(res => res.json()),
  fetch('assets/Budget.json').then(res => res.json()),
  fetch('assets/capital.json').then(res => res.json()),
  fetch('assets/world-map.svg').then(res => res.text())
]).then(([tourist, budget, capital, svgText]) => {
  touristData = tourist;
  countryBudgetData = budget;
  capitalData = capital;
  document.getElementById('map-container').innerHTML = svgText;
  setupMapClickEvents();
  highlightCountriesByBudget(input_min_budget, input_max_budget, input_days);
}).catch(err => {
  console.error('데이터 로드 실패:', err);
});

// --- 지도 클릭 이벤트 연결 ---
function setupMapClickEvents() {
  const svg = document.querySelector('#map-container svg');
  if (!svg) return;
  const paths = svg.querySelectorAll('path');
  paths.forEach(path => {
    path.addEventListener('click', () => {
      const parentGroup = path.closest('g');
      const groupId = parentGroup ? parentGroup.id : null;
      if (!groupId) return;
      lastSelectedId = groupId.toUpperCase();
      close_slide();
      open_slide(groupId);
      Add_Weather(groupId);
      display_budget(groupId);
      renderTouristCardsByCountry(groupId);
      if (!contry_id.includes(groupId)) contry_id.push(groupId);
    });
  });
}

// --- 사이드패널 열기/닫기 ---
function open_slide(id) {
  const sidePanel = document.getElementById('sidePanel');
  sidePanel.classList.add('open');
  const selected = document.getElementById('contry_info');
  selected.innerHTML = '';
  const flagImg = document.createElement('img');
  flagImg.src = `https://flagcdn.com/w80/${id.toLowerCase()}.png`;
  flagImg.alt = `${id} flag`;
  selected.appendChild(flagImg);
  const countryNames = new Intl.DisplayNames(['ko'], { type: 'region' }).of(id.toUpperCase());
  const InputName = document.createElement('p');
  InputName.textContent = countryNames;
  selected.appendChild(InputName);
}
function close_slide() {
  const sidePanel = document.getElementById('sidePanel');
  sidePanel.classList.remove('open');
  document.getElementById('contry_info').innerHTML = '';
  remove_weather();
  document.getElementById('tourist').innerHTML = '';
  document.getElementById('Budget').innerHTML = '';
}
document.getElementById('side-close').addEventListener('click', () => close_slide());

// --- 날씨 표시 ---
function Add_Weather(id){
  const apiKey = "날씨 api key";
  const countryCode = id.toUpperCase();
  const city = capitalData[countryCode];

  if(!city){
    document.getElementById('weather').innerHTML = '<p>날씨 정보를 찾을 수 없습니다.</p>';
    return;
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city},${countryCode}&appid=${apiKey}&units=metric&lang=kr`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      const weather = data.weather[0].description;
      const iconCode = data.weather[0].icon;
      const temp = data.main.temp;
      const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
      const weatherBox = document.getElementById('weather');
      weatherBox.innerHTML = `
        <div class="weather-block">
          <div class="weather-row">
            날씨: <img src="${iconUrl}" alt="${weather}">
          </div>
          <div class="weather-row">
            현재온도: ${temp.toFixed(1)}°C
          </div>
        </div>
      `;
    })
    .catch(error => {
      document.getElementById('weather').innerHTML = '<p>날씨 정보를 불러올 수 없습니다.</p>';
      console.error('날씨 불러오기 실패:', error);
    });
}




function remove_weather() {
  document.getElementById('weather').innerHTML = '';
}

// --- 예산 패널 ---
function display_budget(id) {
  const budgetBox = document.getElementById('Budget');
  const countryCode = id.toUpperCase();

  if (countryBudgetData[countryCode]) {
    const budgetInfo = countryBudgetData[countryCode];
    const total_accommodation = Math.round(budgetInfo.accommodation * (input_days - 1));
    const total_transport = Math.round(budgetInfo.transport * input_days);
    const total_food = Math.round(budgetInfo.food * input_days);
    const total_budget = total_accommodation + total_food + total_transport;
    lasebudget = total_budget;

    budgetBox.innerHTML = `
      <div class="budget-inline-panel">
        <span class="budget-title">${input_days}일 예산</span>
        <div class="budget-inline-row">
          <div class="icon-box hotel">
            <span class="icon"></span>
            <span class="price">${total_accommodation.toLocaleString()} $</span>
          </div>
          <div class="icon-box bus">
            <span class="icon"></span>
            <span class="price">${total_transport.toLocaleString()} $</span>
          </div>
          <div class="icon-box food">
            <span class="icon"></span>
            <span class="price">${total_food.toLocaleString()} $</span>
          </div>
        </div>
        <span class="budget-total-label">항공권 제외</span>
        <span class="budget-total-amount">${total_budget.toLocaleString()} $</span>
      </div>
    `;
  } else {
    budgetBox.innerHTML = `<p>예산 정보가 없습니다.</p>`;
  }
}


// --- 예산별 국가 강조 ---
function highlightCountriesByBudget(input_min_budget, input_max_budget, input_days) {
  for (const countryCode in countryBudgetData) {
    const budgetInfo = countryBudgetData[countryCode];
    const total_accommodation = Number(budgetInfo.accommodation) * (input_days - 1);
    const total_transport = Number(budgetInfo.transport) * input_days;
    const total_food = Number(budgetInfo.food) * input_days;
    const total_budget = total_accommodation + total_food + total_transport;
    const countryElement = document.getElementById(countryCode.toLowerCase());
    if (!countryElement) continue;
    if (total_budget >= input_min_budget && total_budget <= input_max_budget) {
      countryElement.style.fill = '#4CAF50';
      countryElement.style.strokeWidth = '2px';
    } else {
      countryElement.style.fill = '';
      countryElement.style.stroke = '';
      countryElement.style.strokeWidth = '';
    }
  }
}

// --- 관광지 카드 렌더링 ---
function renderTouristGrid(spots) {
  const container = document.getElementById('tourist');
  let html = '<div class="tourist-grid">';
  for (let i = 0; i < 9; i++) {
    const spot = spots[i];
    if (spot) {
      html += `
        <div class="tourist-card">
          <img src="${spot.preview ? spot.preview.source : 'https://via.placeholder.com/80'}" alt="${spot.name}" />
          <div class="tourist-info">
            <h4>${spot.name}</h4>
            <p>${spot.wikipedia_extracts && spot.wikipedia_extracts.text
                ? spot.wikipedia_extracts.text
                : (spot.info || '')}</p>
          </div>
        </div>
      `;
    } else {
      html += `<div class="tourist-card empty"></div>`;
    }
  }
  html += '</div>';
  container.innerHTML = html;
}

// --- OpenTripMap API로 관광지 조회 ---
async function renderTouristCardsByCountry(countryId) {
  const info = countryCenters[countryId.toUpperCase()];
  if (!info) {
    document.getElementById('tourist').innerHTML = '<p>해당 국가의 좌표 정보가 없습니다.</p>';
    return;
  }
  const radius = 20000;
  const radiusUrl = `https://api.opentripmap.com/0.1/en/places/radius?radius=${radius}&lon=${info.lon}&lat=${info.lat}&limit=9&apikey=${apiKey}`;
  try {
    const radiusRes = await fetch(radiusUrl);
    const radiusData = await radiusRes.json();
    const features = radiusData.features || [];
    const details = await Promise.all(features.map(f =>
      fetch(`https://api.opentripmap.com/0.1/en/places/xid/${f.properties.xid}?apikey=${apiKey}`)
        .then(res => res.json())
    ));
    renderTouristGrid(details);
  } catch (err) {
    document.getElementById('tourist').innerHTML = '<p>관광지 정보를 불러오지 못했습니다.</p>';
  }
}

// --- 일정 생성 버튼 ---
document.getElementById('generate-itinerary-btn').addEventListener('click', () => {
  openLeftSidePanel();
  showItineraryLoading();
  setTimeout(() => {
    const itinerary = createDummyItinerary(lastSelectedId, input_days);
    renderItinerary(itinerary);
    renderItineraryMap(itinerary, lastSelectedId);
  }, 1000);
});

// --- 왼쪽 패널 열기/닫기 ---
function openLeftSidePanel() {
  document.getElementById('leftSidePanel').classList.add('open');
  document.getElementById('itinerary-list').innerHTML = '';
  document.getElementById('left-map-container').innerHTML = '';
}
document.getElementById('left-side-close').addEventListener('click', () => {
  document.getElementById('leftSidePanel').classList.remove('open');
});

// --- 일정 로딩 애니메이션 ---
function showItineraryLoading() {
  document.getElementById('itinerary-list').innerHTML = '<p>일정을 생성 중입니다...</p>';
}

// --- 더미 일정 생성 --- => 수정해야함
function createDummyItinerary(countryId, days) {
  const spotsKR = [
    { name: "경복궁", lat: 37.579617, lng: 126.977041, desc: "서울 대표 궁궐" },
    { name: "남산타워", lat: 37.551169, lng: 126.988227, desc: "서울 전망대" },
    { name: "북촌한옥마을", lat: 37.582604, lng: 126.983998, desc: "전통 한옥거리" },
    { name: "명동", lat: 37.563757, lng: 126.982684, desc: "쇼핑 거리" },
    { name: "인사동", lat: 37.574018, lng: 126.984922, desc: "문화 예술 거리" }
  ];
  const spotsJP = [
    { name: "도쿄타워", lat: 35.658581, lng: 139.745438, desc: "도쿄 랜드마크" },
    { name: "아사쿠사", lat: 35.714765, lng: 139.796655, desc: "절과 상점가" },
    { name: "시부야", lat: 35.659487, lng: 139.700044, desc: "번화가" },
    { name: "우에노공원", lat: 35.715298, lng: 139.774054, desc: "벚꽃 명소" }
  ];
  let spots = spotsKR;
  if (countryId === "JP") spots = spotsJP;
  let itinerary = [];
  let idx = 0;
  for (let d = 1; d <= days; d++) {
    let daySpots = [];
    for (let s = 0; s < 2 && idx < spots.length; s++, idx++) {
      daySpots.push(spots[idx]);
    }
    itinerary.push({ day: d, places: daySpots });
    if (idx >= spots.length) break;
  }
  return itinerary;
}

// --- 일정 리스트 렌더링 ---
function renderItinerary(itinerary) {
  const listDiv = document.getElementById('itinerary-list');
  if (!itinerary || itinerary.length === 0) {
    listDiv.innerHTML = '<p>일정 정보가 없습니다.</p>';
    return;
  }
  let html = '<h3>추천 일정</h3><ol>';
  itinerary.forEach(dayPlan => {
    html += `<li><strong>Day ${dayPlan.day}</strong><ul>`;
    dayPlan.places.forEach(place => {
      html += `<li>${place.name} ${place.desc ? `- ${place.desc}` : ''}</li>`;
    });
    html += '</ul></li>';
  });
  html += '</ol>';
  listDiv.innerHTML = html;
}

// --- 일정 지도에 마커 표시 ---
function renderItineraryMap(itinerary, countryId) {
  const countryCoordinates = {
    KR: { lat: 37.5665, lng: 126.9780 },
    JP: { lat: 35.6895, lng: 139.6917 }
  };
  const mapDiv = document.getElementById('left-map-container');
  mapDiv.innerHTML = '<div id="left-map" style="width:100%;height:220px;"></div>';
  const center = countryCoordinates[countryId] || { lat: 37.5665, lng: 126.9780 };
  const map = new google.maps.Map(document.getElementById('left-map'), {
    center: center,
    zoom: 12
  });
  itinerary.forEach(dayPlan => {
    dayPlan.places.forEach(place => {
      new google.maps.Marker({
        position: { lat: place.lat, lng: place.lng },
        map: map,
        title: place.name
      });
    });
  });
}
