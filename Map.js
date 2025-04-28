//마지막에 클릭된 국가 id 저장
let lastSelectedId = null;
//입력된 금액
let input_money = 0;
//입력 여행 일수
let input_days = 10;

//국가코드 => 수도 데이터
let capitalData = {};
fetch('assets/capital.json')
  .then(response => response.json())
  .then(data => {
    capitalData = data;
  })
  .catch(err => console.error('수도 데이터 불러오기 실패:', err));


//지도 클릭 이벤트
fetch('assets/world-map.svg')
  .then(res => res.text())
  .then(svgText => {
    const container = document.getElementById('map-container');
    container.innerHTML = svgText;

    const svg = container.querySelector('svg');
    const paths = svg.querySelectorAll('path');

    paths.forEach(path => {
      path.addEventListener('click', () => {
        const parentGroup = path.closest('g');
        const groupId = parentGroup ? parentGroup.id : 'no-group-id';
        
        lastSelectedId = groupId;

        close_slide(groupId);
        open_slide(groupId);
        Add_Weather(groupId);
        display_budget(groupId); // 예산 정보 표시

        // 중복된 id가 없을 때만 배열에 추가
        if (!contry_id.includes(groupId)) {
          contry_id.push(groupId);
        }

      });
    });
  });


//사이드패널 열기, 국기, 국가 이름  
  function open_slide(id){
    const sidePanel = document.getElementById('sidePanel');
     sidePanel.classList.toggle('open');
    const selected = document.getElementById('contry_info');
      selected.innerHTML = '';
     //사이드 패널 상단에 국기 넣기
    const flagImg = document.createElement('img');
     flagImg.src = `https://flagcdn.com/w80/${id.toLowerCase()}.png`;
     flagImg.alt = `${id} flag`;
     flagImg.style.width = '40%';
     flagImg.style.height = '100%';
     flagImg.style.marginTop = '0px';
     flagImg.style.borderRadius = '5% 0% 0% 0%';
     selected.appendChild(flagImg);
     //국기 옆에 나라 이름 작성
     const upperId = id.toUpperCase(); //=> svg에서 제공하는 id가 (영어)소문자라서 대문자로 바꿈
     console.log(upperId);
     const countryNames = new Intl.DisplayNames(['ko'], { type: 'region' }).of(`${upperId}`);//국가id를 한국어로 변환
     const InputName = document.createElement('p');
     InputName.textContent = countryNames;
     selected.appendChild(InputName);
  }
//사이드패널 닫기
  function close_slide(id){
    //사이드패널 우측(화면 밖 이동)
    const sidePanel = document.getElementById('sidePanel');
        sidePanel.classList.remove('open');
    //contry_info 제거
    const selected = document.getElementById('contry_info');
    selected.innerHTML = '';
  }
  //닫기버튼 동작
  document.addEventListener('DOMContentLoaded',()=>{
    document.getElementById('side-close').addEventListener('click', ()=>{
      if(lastSelectedId){
      close_slide(lastSelectedId);
      }
    });
  });

  //날씨 함수 추가
  function Add_Weather(id){
    const apiKey = "79fc9d5f205b88928b916382beacdf68";
    const countryCode = id.toUpperCase();
    const city = capitalData[countryCode];

    if(!city){
      console.warn(`날씨 정보를 찾을 수 없습니다.`);
      return;
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city},${countryCode}&appid=${apiKey}&units=metric&lang=kr`;

    fetch(url)
      .then(response => response.json())
      .then(data => {
        const weather = data.weather[0].description;
        const temp = data.main.temp;
        const weatherBox = document.getElementById('weather');
        weatherBox.innerHTML = `<p>날씨: ${weather}</p><p>현재온도: ${temp}°C</p>`;
  })
  .catch(error => console.error('날씨 불러오기 실패:', error));
  }
  //날씨 지우기 함수
  function remove_weather(){
    const weatherBox = document.getElementById('weather');
    weatherBow.innerHTML = '';
  }
  /*관광지 추천 시작, 미완////////////////////////////////////////////////
  const countryBoundingBoxes = {
    "KR": [124.609756, 33.199379, 131.872222, 38.612789], // 대한민국
    "US": [-125.0, 24.5, -66.9, 49.5], // 미국
    "FR": [-5.1, 41.3, 9.6, 51.1], // 프랑스
    "JP": [122.9385, 24.3963, 153.9866, 45.5515], // 일본
    // 필요한 국가 추가
  };
  const apiKey ="5ae2e3f221c38a28845f05b6b83cb1a3c450df4a7fe5d406b3d5b077";
  
  const koreaBoundingBox = countryBoundingBoxes["JP"];
  const lon_min = koreaBoundingBox[0]; // 124.609756
  const lat_min = koreaBoundingBox[1]; // 33.199379
  const lon_max = koreaBoundingBox[2]; // 131.872222
  const lat_max = koreaBoundingBox[3]; // 38.612789
  
  // OpenTripMap API를 이용해 해당 바운딩박스 범위 내 여행지 가져오기
  const url = `https://api.opentripmap.com/0.1/en/places/bbox?lon_min=${lon_min}&lat_min=${lat_min}&lon_max=${lon_max}&lat_max=${lat_max}&limit=10&apikey=${apiKey}`;
  
  fetch(url)
  .then(response => response.json())
  .then(data => {
    const places = data.features;

    const popularKeywords = ['Tower', 'Museum', 'Park', 'Palace', 'Temple', 'Beach'];

    const filteredPlaces = places.filter(place => {
      return popularKeywords.some(keyword => place.properties.name.includes(keyword));
    });

    filteredPlaces.slice(0, 10).forEach((place, index) => {
      console.log(`${index + 1}. ${place.properties.name}`);
      console.log(`   카테고리: ${place.properties.kinds}`);
      console.log(`   위치: ${place.geometry.coordinates[1]}, ${place.geometry.coordinates[0]}`);
    });
  })
  .catch(error => console.error('여행지 정보 가져오기 실패:', error));
  //관광지 추천 끝/////////////////////////////////////////////////////////////////////*/
  //예산 계산 함수 시작
  let Budget = {};
  fetch('assets/Budget.json')
  .then(response => response.json())
  .then(data => {
    countryBudgetData = data;  // 파일 데이터를 변수에 저장
  })
  .catch(error => console.error('예산 데이터 불러오기 실패:', error));

  // 예산 정보 표시 함수
function display_budget(id) {
  const budgetBox = document.getElementById('Budget');
  const countryCode = id.toUpperCase();

  // JSON에 해당 국가가 있을 경우 예산 정보를 표시
  if (countryBudgetData[countryCode]) {
    const budgetInfo = countryBudgetData[countryCode];
    const total_accommodation = budgetInfo.accommodation*(input_days - 1);
    const total_transport = budgetInfo.transport*input_days;
    const total_food = budgetInfo.food*input_days;
    const total_budget = total_accommodation + total_food + total_transport;
    budgetBox.innerHTML = `
      <p>${input_days}일 기준 비용 </p>
      <p>숙박비: ${total_accommodation} $</p>
      <p>교통비: ${total_transport} $</p>
      <p>식비: ${total_food} $</p>
      <p>항공권 제외 : ${total_budget} $</p>
    `;
  } else {
    budgetBox.innerHTML = `<p>예산 정보가 없습니다.</p>`;
  }
}
//예산 끝// 수정 예정



