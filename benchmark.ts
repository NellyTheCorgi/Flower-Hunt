import { performance } from 'perf_hooks';

// Mock deleteDoc with a 50ms network latency
const deleteDocMock = async (id: string) => {
  return new Promise(resolve => setTimeout(resolve, 50));
};

const runBenchmark = async () => {
  const docs = Array.from({ length: 20 }).map((_, i) => ({ id: `doc_${i}` }));
  const collId = 'doc_0';

  console.log("Starting baseline (Sequential)...");
  const startSeq = performance.now();
  for (const oldDoc of docs) {
    if (oldDoc.id !== collId) {
      await deleteDocMock(oldDoc.id);
    }
  }
  const endSeq = performance.now();
  console.log(`Baseline Sequential took: ${(endSeq - startSeq).toFixed(2)} ms`);

  console.log("Starting optimized (Promise.all)...");
  const startPar = performance.now();
  const promises = [];
  for (const oldDoc of docs) {
    if (oldDoc.id !== collId) {
      promises.push(deleteDocMock(oldDoc.id));
    }
  }
  await Promise.all(promises);
  const endPar = performance.now();
  console.log(`Optimized Promise.all took: ${(endPar - startPar).toFixed(2)} ms`);

  console.log("Starting optimized (Mocked writeBatch)...");
  const startBatch = performance.now();
  // Batch simulates 1 network request of 50ms
  await new Promise(resolve => setTimeout(resolve, 50));
  const endBatch = performance.now();
  console.log(`Optimized writeBatch took: ${(endBatch - startBatch).toFixed(2)} ms`);
};

runBenchmark();
