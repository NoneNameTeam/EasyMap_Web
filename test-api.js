// test-api.js
const BASE_URL = 'https://easymap-dev.qwqme.com';

// 工具函数：美化输出
function log(title, data) {
  console.log('\n' + '='.repeat(50));
  console.log(`📍 ${title}`);
  console.log('='.repeat(50));
  console.log(JSON.stringify(data, null, 2));
}

// 工具函数：处理请求
async function request(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    const data = await response.json();
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 测试函数
async function runTests() {
  console.log('🚀 开始测试 EasyMap API...\n');

  // 1. 健康检查
  const health = await request(`${BASE_URL}/health`);
  log('1. 健康检查 GET /health', health);

  // 2. 创建地图数据
  const createMap = await request(`${BASE_URL}/maps/data`, {
    method: 'POST',
    body: JSON.stringify({
      x: 10,
      y: 20,
      block: 'ROAD',
      traffic: 'NORMAL',
      event: null,
      roadId: 'road-test-1',
    }),
  });
  log('2. 创建地图数据 POST /maps/data', createMap);

  const mapId = createMap.data?.id;

  // 3. 获取地图数据列表（无过滤）
  const getMaps = await request(`${BASE_URL}/maps/data?limit=5`);
  log('3. 获取地图数据列表 GET /maps/data', getMaps);

  // 4. 获取地图数据（按block过滤）
  const getMapsFiltered = await request(`${BASE_URL}/maps/data?block=ROAD&limit=5`);
  log('4. 获取地图数据（过滤ROAD） GET /maps/data?block=ROAD', getMapsFiltered);

  // 5. 更新地图数据
  if (mapId) {
    const updateMap = await request(`${BASE_URL}/maps/data/${mapId}`, {
      method: 'PUT',
      body: JSON.stringify({
        traffic: 'CONGESTED',
        event: 'ACCIDENT',
      }),
    });
    log(`5. 更新地图数据 PUT /maps/data/${mapId}`, updateMap);
  }

  // 6. 按坐标获取地图数据
  const getMapByCoord = await request(`${BASE_URL}/maps/10/20`);
  log('6. 按坐标获取地图 GET /maps/10/20', getMapByCoord);

  // 7. 创建对象（道路）
  const createObject = await request(`${BASE_URL}/objects`, {
    method: 'PUT',
    body: JSON.stringify({
      name: '测试道路A',
      type: 'ROAD',
      nodes: [
        {
          x: 30,
          y: 40,
          block: 'ROAD',
          traffic: 'SMOOTH',
          event: null,
        },
        {
          x: 31,
          y: 41,
          block: 'ROAD',
          traffic: 'NORMAL',
          event: null,
        },
      ],
    }),
  });
  log('7. 创建对象 PUT /objects', createObject);

  const objectId = createObject.data?.id;

  // 8. 获取对象列表
  const getObjects = await request(`${BASE_URL}/objects?limit=5`);
  log('8. 获取对象列表 GET /objects', getObjects);

  // 9. 向对象添加节点
  if (objectId && mapId) {
    const addNode = await request(`${BASE_URL}/objects/${objectId}/nodes`, {
      method: 'POST',
      body: JSON.stringify({
        nodeId: String(mapId),
      }),
    });
    log(`9. 向对象添加节点 POST /objects/${objectId}/nodes`, addNode);
  }

  // 10. 分页测试
  const getMapsPage1 = await request(`${BASE_URL}/maps/data?limit=2`);
  log('10. 分页测试 - 第1页', getMapsPage1);

  if (getMapsPage1.data?.nextCursor) {
    const getMapsPage2 = await request(
      `${BASE_URL}/maps/data?limit=2&cursor=${getMapsPage1.data.nextCursor}`
    );
    log('11. 分页测试 - 第2页', getMapsPage2);
  }

  console.log('\n✅ 测试完成！\n');
}

// 运行测试
runTests();