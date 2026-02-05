/**
 * Test script for Keyword Search Jobs feature
 *
 * This script demonstrates how to:
 * 1. Create a keyword search job
 * 2. Start the job
 * 3. Monitor its progress
 * 4. View results
 * 5. Track promising keywords
 *
 * Usage: node test-jobs.js
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';
const SESSION_ID = 'test-session-' + Date.now();

// Helper function to wait
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

async function createJob() {
  console.log('\n📝 Creating a new keyword search job...');

  try {
    const response = await api.post('/jobs', {
      name: 'Test Discovery Job - ' + new Date().toLocaleString(),
      searchesPerBatch: 2,
      intervalMinutes: 1, // 1 minute for quick testing
      totalCycles: 3, // Just 3 cycles for testing
      country: 'us',
      strategy: 'random',
      sessionId: SESSION_ID,
      notes: 'Automated test job',
    });

    const job = response.data;
    console.log('✅ Job created successfully!');
    console.log(`   ID: ${job.id}`);
    console.log(`   Name: ${job.name}`);
    console.log(`   Strategy: ${job.strategy}`);
    console.log(`   Cycles: ${job.totalCycles}`);
    console.log(`   Interval: ${job.intervalMinutes} minutes`);

    return job;
  } catch (error) {
    console.error('❌ Error creating job:', error.response?.data || error.message);
    throw error;
  }
}

async function startJob(jobId) {
  console.log(`\n▶️  Starting job ${jobId}...`);

  try {
    await api.post(`/jobs/${jobId}/start`);
    console.log('✅ Job started successfully!');
  } catch (error) {
    console.error('❌ Error starting job:', error.response?.data || error.message);
    throw error;
  }
}

async function monitorJob(jobId) {
  console.log('\n👀 Monitoring job progress...\n');

  let previousCycle = 0;
  let isComplete = false;

  while (!isComplete) {
    try {
      const response = await api.get(`/jobs/${jobId}`);
      const job = response.data;

      if (job.currentCycle > previousCycle) {
        console.log(`📊 Cycle ${job.currentCycle}/${job.totalCycles} completed`);
        console.log(`   Keywords found: ${job.totalKeywords}`);
        console.log(`   Results: ${job._count?.results || job.results?.length || 0}`);
        previousCycle = job.currentCycle;
      }

      if (job.status === 'completed') {
        console.log('\n✅ Job completed!');
        isComplete = true;
      } else if (job.status === 'failed') {
        console.log('\n❌ Job failed!');
        isComplete = true;
      } else if (job.status !== 'running') {
        console.log(`\n⏸️  Job status: ${job.status}`);
        isComplete = true;
      }

      if (!isComplete) {
        await sleep(5000); // Check every 5 seconds
      }
    } catch (error) {
      console.error('❌ Error monitoring job:', error.response?.data || error.message);
      break;
    }
  }
}

async function viewResults(jobId) {
  console.log('\n📋 Fetching job results...\n');

  try {
    const response = await api.get(`/jobs/${jobId}`);
    const job = response.data;

    if (!job.results || job.results.length === 0) {
      console.log('   No results yet');
      return [];
    }

    console.log(`Found ${job.results.length} keyword results:\n`);

    // Sort by opportunity score
    const sortedResults = job.results
      .filter(r => r.status === 'success')
      .sort((a, b) => (b.opportunityScore || 0) - (a.opportunityScore || 0));

    // Display top 10
    const topResults = sortedResults.slice(0, 10);

    console.log('Top Keywords by Opportunity Score:');
    console.log('═'.repeat(80));
    console.log('Keyword'.padEnd(30) + 'Pop'.padEnd(8) + 'Diff'.padEnd(8) + 'Opp'.padEnd(8) + 'Comps');
    console.log('─'.repeat(80));

    topResults.forEach(result => {
      const keyword = result.keyword.padEnd(30);
      const pop = (result.popularity || '-').toString().padEnd(8);
      const diff = (result.difficulty || '-').toString().padEnd(8);
      const opp = (result.opportunityScore?.toFixed(1) || '-').toString().padEnd(8);
      const comps = result.competitorCount || '-';

      console.log(`${keyword}${pop}${diff}${opp}${comps}`);
    });

    return topResults;
  } catch (error) {
    console.error('❌ Error viewing results:', error.response?.data || error.message);
    return [];
  }
}

async function trackKeywords(jobId, results) {
  if (results.length === 0) {
    console.log('\n⚠️  No results to track');
    return;
  }

  console.log('\n💾 Tracking top 3 keywords...');

  try {
    // Track top 3 results
    const resultIds = results.slice(0, 3).map(r => r.id);

    await api.post(`/jobs/${jobId}/track-keywords`, {
      resultIds,
      sessionId: SESSION_ID,
    });

    console.log('✅ Keywords tracked successfully!');

    // Fetch tracked keywords
    const trackedResponse = await api.get('/tracked/keywords', {
      params: { sessionId: SESSION_ID },
    });

    console.log(`\n📌 You now have ${trackedResponse.data.length} tracked keywords`);
  } catch (error) {
    console.error('❌ Error tracking keywords:', error.response?.data || error.message);
  }
}

async function listJobs() {
  console.log('\n📚 All jobs for this session:\n');

  try {
    const response = await api.get('/jobs', {
      params: { sessionId: SESSION_ID },
    });

    const jobs = response.data;

    if (jobs.length === 0) {
      console.log('   No jobs found');
      return;
    }

    jobs.forEach(job => {
      console.log(`   ${job.status === 'completed' ? '✅' : job.status === 'running' ? '▶️' : '⏸️'}  ${job.name}`);
      console.log(`      Status: ${job.status} | Cycles: ${job.currentCycle}/${job.totalCycles} | Keywords: ${job.totalKeywords}`);
      console.log(`      Created: ${new Date(job.createdAt).toLocaleString()}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error listing jobs:', error.response?.data || error.message);
  }
}

async function main() {
  console.log('═'.repeat(80));
  console.log('🚀 Keyword Search Jobs - Test Script');
  console.log('═'.repeat(80));

  try {
    // Check if server is running
    console.log('\n🔍 Checking server health...');
    await api.get('/health');
    console.log('✅ Server is running');

    // Create a job
    const job = await createJob();

    // Start the job
    await startJob(job.id);

    // Monitor progress
    await monitorJob(job.id);

    // View results
    const results = await viewResults(job.id);

    // Track best keywords
    await trackKeywords(job.id, results);

    // List all jobs
    await listJobs();

    console.log('\n═'.repeat(80));
    console.log('✨ Test completed successfully!');
    console.log('═'.repeat(80));
    console.log('\nNext steps:');
    console.log('1. View the job in the frontend at http://localhost:5173/keywordsearch/jobs');
    console.log('2. Check tracked keywords at http://localhost:5173/keywordsearch/tracking');
    console.log('3. Create more jobs with different strategies');
    console.log('');

  } catch (error) {
    console.log('\n═'.repeat(80));
    console.log('❌ Test failed');
    console.log('═'.repeat(80));
    console.error(error.message);
    process.exit(1);
  }
}

// Run the test
main();
