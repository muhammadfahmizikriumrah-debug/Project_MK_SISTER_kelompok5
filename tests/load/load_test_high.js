const http = require('http');
const { performance } = require('perf_hooks');

const TARGET_URL = 'http://localhost:3001/health';
const CONCURRENT_USERS = 200;
const RAMP_UP_TIME = 10000;
const TEST_DURATION = 30000;
const RESULTS = [];

function makeRequest() {
  const startTime = performance.now();
  const req = http.get(TARGET_URL, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      RESULTS.push({
        statusCode: res.statusCode,
        duration: duration,
        timestamp: new Date().toISOString()
      });
    });
  });

  req.on('error', (err) => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    RESULTS.push({
      statusCode: 0,
      duration: duration,
      error: err.message,
      timestamp: new Date().toISOString()
    });
  });

  req.setTimeout(5000, () => {
    req.destroy();
  });
}

async function runLoadTest() {
  console.log(`Starting high-load test: ${CONCURRENT_USERS} concurrent users`);
  console.log(`Target: ${TARGET_URL}`);
  console.log(`Duration: ${TEST_DURATION/1000}s\n`);

  const startTime = performance.now();
  const endTime = startTime + TEST_DURATION;
  const spawnInterval = RAMP_UP_TIME / CONCURRENT_USERS;

  for (let i = 0; i < CONCURRENT_USERS; i++) {
    setTimeout(() => {
      const interval = setInterval(() => {
        if (performance.now() >= endTime) {
          clearInterval(interval);
          return;
        }
        makeRequest();
      }, 1000);
    }, i * spawnInterval);
  }

  setTimeout(() => {
    const totalRequests = RESULTS.length;
    const errors = RESULTS.filter(r => r.statusCode !== 200);
    const successRate = ((totalRequests - errors.length) / totalRequests * 100).toFixed(2);
    
    const durations = RESULTS.filter(r => r.statusCode === 200).map(r => r.duration);
    durations.sort((a, b) => a - b);
    
    const avgLatency = (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(2);
    const p50 = durations[Math.floor(durations.length * 0.5)].toFixed(2);
    const p95 = durations[Math.floor(durations.length * 0.95)].toFixed(2);
    const p99 = durations[Math.floor(durations.length * 0.99)].toFixed(2);

    console.log('\n=== HIGH-LOAD TEST RESULTS ===');
    console.log(`Total Requests: ${totalRequests}`);
    console.log(`Success Rate: ${successRate}%`);
    console.log(`Errors: ${errors.length}`);
    console.log(`Average Latency: ${avgLatency}ms`);
    console.log(`p50 Latency: ${p50}ms`);
    console.log(`p95 Latency: ${p95}ms`);
    console.log(`p99 Latency: ${p99}ms`);

    if (errors.length > 0) {
      console.log('\nError Details:');
      errors.slice(0, 5).forEach(err => {
        console.log(`  Status: ${err.statusCode}, Duration: ${err.duration.toFixed(2)}ms`);
      });
    }

    process.exit(0);
  }, TEST_DURATION + 2000);
}

runLoadTest();
