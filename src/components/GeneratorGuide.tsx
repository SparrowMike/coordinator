import { useState, useEffect, useMemo } from 'react';
import { Highlight, themes } from 'prism-react-renderer';

type PassType = 1 | 2;

interface Step {
  title: string;
  content: JSX.Element;
}

const CodeBlock = ({ code, language = 'javascript' }: { code: string; language?: string }) => (
  <div className="bg-gray-900 rounded-lg overflow-hidden">
    <Highlight theme={themes.vsDark} code={code.trim()} language={language as any}>
      {({ style, tokens, getLineProps, getTokenProps }) => (
        <pre style={style} className="p-4 overflow-x-auto text-sm leading-relaxed m-0">
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  </div>
);

const OutputBox = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-slate-950 border border-slate-700 rounded-md p-3 font-mono text-sm">
    {children}
  </div>
);

export const GeneratorGuide = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [passNumber, setPassNumber] = useState<PassType>(1);

  // FIRST PASS: Building Understanding
  const firstPassSteps = useMemo<Step[]>(() => [
    {
      title: "🎯 What is a Generator? (First Principles)",
      content: (
        <div className="space-y-4">
          <div className="bg-cyan-500/20 border border-cyan-500 p-4 rounded-lg">
            <strong className="text-cyan-400 text-lg">Core Concept:</strong>
            <p className="text-gray-300 mt-2">
              A generator is a special function that can <strong className="text-yellow-400">pause</strong> and <strong className="text-yellow-400">resume</strong> its execution.
              Normal functions run start-to-finish. Generators can stop in the middle and continue later.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-white font-bold mb-2">❌ Regular Function:</h4>
              <CodeBlock code={`function regularFunction() {
  console.log('Step 1');
  console.log('Step 2');
  console.log('Step 3');
  return 'Done!';
}

// Runs ALL steps at once
regularFunction();
// Output:
// Step 1
// Step 2
// Step 3
// Returns: 'Done!'`} />
              <div className="mt-2 text-sm text-gray-400">
                ⚡ Executes completely in one go
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold mb-2">✅ Generator Function:</h4>
              <CodeBlock code={`function* generatorFunction() {
  console.log('Step 1');
  yield 'Paused at 1';
  console.log('Step 2');
  yield 'Paused at 2';
  console.log('Step 3');
  return 'Done!';
}

// Can pause between steps
const gen = generatorFunction();
gen.next(); // Step 1, PAUSE
gen.next(); // Step 2, PAUSE
gen.next(); // Step 3, DONE`} />
              <div className="mt-2 text-sm text-gray-400">
                ⏸️ Can pause and resume execution
              </div>
            </div>
          </div>

          <div className="bg-blue-900/30 border border-blue-500 p-4 rounded-lg">
            <strong className="text-blue-400">Key Syntax:</strong>
            <ul className="text-gray-300 mt-2 space-y-1 list-disc list-inside">
              <li><code className="text-yellow-300">function*</code> - The asterisk (*) makes it a generator</li>
              <li><code className="text-yellow-300">yield</code> - The pause button (like a breakpoint)</li>
              <li><code className="text-yellow-300">.next()</code> - Resume execution until next yield</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "⏸️ Understanding 'yield' - The Pause Button",
      content: (
        <div className="space-y-4">
          <div className="bg-purple-500/20 border border-purple-500 p-4 rounded-lg">
            <strong className="text-purple-400 text-lg">What does 'yield' do?</strong>
            <p className="text-gray-300 mt-2">
              <code className="text-yellow-300">yield</code> does THREE things:
            </p>
            <ol className="text-gray-300 mt-2 space-y-2 list-decimal list-inside">
              <li><strong>Pauses</strong> the function execution right there</li>
              <li><strong>Returns</strong> a value to the caller</li>
              <li><strong>Remembers</strong> exactly where it paused (saves the state)</li>
            </ol>
          </div>

          <CodeBlock code={`function* countToThree() {
  console.log('🚀 Starting...');

  yield 1;  // ⏸️ PAUSE HERE

  console.log('▶️ Resumed from first pause');

  yield 2;  // ⏸️ PAUSE HERE

  console.log('▶️ Resumed from second pause');

  yield 3;  // ⏸️ PAUSE HERE

  console.log('✅ All done!');
}

// Create the generator (doesn't run yet!)
const gen = countToThree();`} />

          <div className="bg-yellow-900/20 border border-yellow-500 p-3 rounded-lg">
            <strong className="text-yellow-400">⚠️ Important:</strong>
            <p className="text-gray-300 text-sm mt-1">
              Just calling <code>countToThree()</code> doesn't run the function!
              It creates a "controller" that lets you run it step-by-step.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "▶️ Step 1: First .next() Call",
      content: (
        <div className="space-y-4">
          <CodeBlock code={`const gen = countToThree();

// Call .next() for the first time
const result1 = gen.next();`} />

          <div className="bg-green-900/30 border border-green-500 p-4 rounded-lg">
            <strong className="text-green-400 text-lg">What Happens:</strong>
            <div className="mt-3 space-y-2">
              <OutputBox>
                <div className="text-green-400">// Console Output:</div>
                <div className="text-white">🚀 Starting...</div>
              </OutputBox>
              <div className="text-gray-300">
                ↓ Function runs until it hits the first <code className="text-yellow-300">yield 1</code>
              </div>
              <OutputBox>
                <div className="text-green-400">// Return Value:</div>
                <div className="text-white">{`{ value: 1, done: false }`}</div>
              </OutputBox>
              <div className="text-gray-300">
                ⏸️ Function is now <strong className="text-yellow-400">PAUSED</strong> at the yield
              </div>
            </div>
          </div>

          <CodeBlock code={`console.log(result1);
// Output: { value: 1, done: false }
//
// value: The value that was yielded (1)
// done:  false means "not finished yet"`} />

          <div className="bg-blue-900/30 border border-blue-500 p-4 rounded-lg">
            <strong className="text-blue-400">State of Execution:</strong>
            <div className="mt-2 text-gray-300 font-mono text-sm space-y-1">
              <div>Line 1: ✅ Executed (logged "Starting...")</div>
              <div>Line 3: ⏸️ PAUSED HERE (yielded 1)</div>
              <div>Line 5: ⏳ Not executed yet</div>
              <div>Line 7: ⏳ Not executed yet</div>
              <div>Line 9: ⏳ Not executed yet</div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "▶️ Steps 2-4: More .next() Calls",
      content: (
        <div className="space-y-4">
          <CodeBlock code={`// Second .next() call
const result2 = gen.next();
// Logs: "▶️ Resumed from first pause"
// Returns: { value: 2, done: false }
// Pauses at: yield 2

// Third .next() call
const result3 = gen.next();
// Logs: "▶️ Resumed from second pause"
// Returns: { value: 3, done: false }
// Pauses at: yield 3

// Fourth .next() call
const result4 = gen.next();
// Logs: "✅ All done!"
// Returns: { value: undefined, done: true }
// Function complete!`} />

          <div className="bg-purple-900/30 border border-purple-500 p-4 rounded-lg">
            <strong className="text-purple-400">Complete Execution Summary:</strong>
            <div className="mt-2 space-y-1 font-mono text-sm">
              <div className="text-cyan-400">gen.next() #1 → {`{ value: 1, done: false }`}</div>
              <div className="text-cyan-400">gen.next() #2 → {`{ value: 2, done: false }`}</div>
              <div className="text-cyan-400">gen.next() #3 → {`{ value: 3, done: false }`}</div>
              <div className="text-green-400">gen.next() #4 → {`{ value: undefined, done: true }`}</div>
            </div>
          </div>

          <div className="bg-cyan-500/20 border border-cyan-500 p-4 rounded-lg">
            <strong className="text-cyan-400">🎯 Key Insight:</strong>
            <p className="text-gray-300 mt-2">
              Each <code className="text-yellow-300">yield</code> is like a bookmark.
              The generator remembers its place, pauses, and waits for you to call
              <code className="text-yellow-300"> .next()</code> to continue from that bookmark.
            </p>
          </div>
        </div>
      )
    }
  ], []);

  // SECOND PASS: Deep Dive into Your Upload Code
  const secondPassSteps = useMemo<Step[]>(() => [
    {
      title: "🎯 The Problem: 20,000 Files to Upload",
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-red-900 to-orange-900 p-4 rounded-lg">
            <strong className="text-white text-lg">❌ Naive Approach:</strong>
            <div className="mt-3 space-y-2 text-gray-300">
              <CodeBlock code={`// BAD: Create ALL promises immediately
const promises = fileIds.map(id => initiateUpload(id));

// What happens:
// - ALL 20,000 promises created RIGHT NOW
// - Each promise: ~2.5KB
// - Total memory: 20,000 × 2.5KB = 50MB
// - All promises compete for resources
// - Browser may freeze
// - Memory issues possible`} />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-900 to-blue-900 p-4 rounded-lg">
            <strong className="text-white text-lg">✅ Generator Approach:</strong>
            <div className="mt-3 space-y-2 text-gray-300">
              <CodeBlock code={`// GOOD: Create promises on-demand
function* uploadGenerator(fileIds) {
  for (const id of fileIds) {
    yield initiateUpload(id);
    // Only creates promise when yielded
    // Then PAUSES until .next() called
  }
}

// What happens:
// - Only 10 promises at a time (concurrency limit)
// - Total memory: 10 × 2.5KB = 25KB
// - 99.95% memory reduction!
// - No browser freeze
// - No memory issues`} />
            </div>
          </div>
        </div>
      )
    },
    {
      title: "📝 New Generator Implementation",
      content: (
        <div className="space-y-4">
          <div className="bg-cyan-500/20 border-2 border-cyan-500 p-4 rounded-lg">
            <strong className="text-cyan-400 text-xl">Full Code:</strong>
          </div>

          <CodeBlock language="typescript" code={`/**
 * Generator that yields file initiation promises LAZILY
 * Only creates promises as they're consumed (not all upfront)
 */
function* initiateFilesGenerator(fileIds: string[]) {
  for (const fileId of fileIds) {
    // ═══════════════════════════════════════════════════════
    // This entire 'yield' statement:
    // 1. Creates ONE promise (for current fileId)
    // 2. Returns that promise to caller
    // 3. PAUSES here until .next() called
    // ═══════════════════════════════════════════════════════
    yield (async () => {
      const fileData = getFileData(fileId);

      try {
        // Call API to initiate upload
        const initResult = await initiateUploadAPI(fileData);

        // Store uploadUrl and transactionId
        updateFileStore(fileId, {
          uploadUrl: initResult.uploadUrl,
          transactionId: initResult.id,
        });
      } catch (error) {
        handleError(fileId, error);
      }
    })(); // ← IIFE: Creates promise when yielded
  }
}`} />

          <div className="bg-purple-900/30 border border-purple-500 p-4 rounded-lg">
            <strong className="text-purple-400">What Each Yield Does:</strong>
            <div className="mt-2 space-y-2 text-sm text-gray-300">
              <div>1. Gets file data from store</div>
              <div>2. Calls API to initiate upload</div>
              <div>3. Returns uploadUrl and transactionId</div>
              <div>4. Updates store with "preUpload" state</div>
              <div>5. Handles any errors</div>
              <div className="text-yellow-400 mt-2">Then PAUSES, waiting for next .next() call!</div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "🔄 processConcurrently: The Complete Implementation",
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-cyan-900 to-blue-900 p-4 rounded-lg border-2 border-cyan-500">
            <strong className="text-white text-xl">⚡ THE CRITICAL FUNCTION:</strong>
            <p className="text-gray-300 mt-2 text-lg">
              This connects generator to controlled concurrency.
              It's what makes lazy promise creation actually work.
            </p>
          </div>

          <CodeBlock language="typescript" code={`/**
 * Process async tasks from a generator with controlled concurrency
 */
export const processConcurrently = async <T>(
  generator: Generator<Promise<T>, void, unknown>,
  concurrency: number,
): Promise<PromiseSettledResult<T>[]> => {
  const results: PromiseSettledResult<T>[] = [];
  const executing = new Set<Promise<void>>();

  // ═══════════════════════════════════════════════════════
  // THIS LOOP IS THE MAGIC
  // It automatically calls generator.next() each iteration!
  // ═══════════════════════════════════════════════════════
  for (const promise of generator) {
    // ↑↑↑ This line does:
    // 1. Calls generator.next()
    // 2. Generator runs until 'yield'
    // 3. Generator returns { value: promise, done: false }
    // 4. We get that promise
    // 5. Generator PAUSES at yield
    // 6. Loop continues with that promise

    const index = results.length;
    results.push({
      status: 'fulfilled',
      value: undefined as any
    });

    // Wrap promise to track completion
    const worker = promise
      .then((value: T) => {
        results[index] = { status: 'fulfilled', value };
      })
      .catch((reason: unknown) => {
        results[index] = { status: 'rejected', reason };
      })
      .finally(() => {
        executing.delete(worker);  // Remove when done
      });

    executing.add(worker);  // Track active promise

    // ═══════════════════════════════════════════════════════
    // CONCURRENCY CONTROL: Wait if at capacity
    // ═══════════════════════════════════════════════════════
    if (executing.size >= concurrency) {
      await Promise.race(executing);
      // ↑ Waits for ANY promise to finish
      // Then loop continues → calls generator.next()
      // Gets next promise!
    }
  }

  // Wait for all remaining promises
  await Promise.all(executing);

  return results;
};`} />

          <div className="bg-yellow-900/30 border-2 border-yellow-500 p-4 rounded-lg">
            <strong className="text-yellow-400 text-lg">⚠️ Critical Understanding:</strong>
            <div className="mt-3 space-y-2 text-gray-300">
              <CodeBlock code={`// These two are equivalent:

// Option 1: for...of (what we use)
for (const promise of generator) {
  // ...
}

// Option 2: Manual .next() calls
while (true) {
  const result = generator.next();
  if (result.done) break;
  const promise = result.value;
  // ...
}`} />
              <p className="text-lg">
                The <code className="text-yellow-300">for...of</code> loop
                automatically calls <code className="text-yellow-300">.next()</code>
                for us
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "🎬 Complete Execution Flow (With 20,000 Files)",
      content: (
        <div className="space-y-4">
          <div className="bg-blue-900/30 border border-blue-500 p-4 rounded-lg">
            <strong className="text-blue-400 text-xl">How It All Works Together:</strong>
          </div>

          <CodeBlock code={`// Entry point
const MAX_CONCURRENT = 10;

await processConcurrently(
  initiateFilesGenerator(fileIds),  // 20,000 files
  MAX_CONCURRENT,
);

// ═══════════════════════════════════════════════════════
// WHAT HAPPENS STEP BY STEP:
// ═══════════════════════════════════════════════════════

// STEP 1: Create generator (NO promises created yet)
const gen = initiateFilesGenerator(fileIds);
// Memory: 0 promises

// Loop iteration 1:
for (const promise of gen) {
  // Calls gen.next()
  // Generator creates promise for fileIds[0]
  // Generator pauses at yield
  executing.add(promise);  // executing.size = 1
}
// Memory: 1 promise

// Loop iteration 2:
// Calls gen.next()
// Generator creates promise for fileIds[1]
// executing.add(promise);  // executing.size = 2
// Memory: 2 promises

// ... iterations 3-10 ...
// Memory: 10 promises

// Loop iteration 11:
// executing.size = 10 (AT CAPACITY!)
if (executing.size >= 10) {
  await Promise.race(executing);  // WAIT
}
// Promise for fileIds[0] finishes!
// executing.size = 9

// Calls gen.next()
// Generator creates promise for fileIds[10]
// executing.add(promise);  // executing.size = 10
// Memory: STILL only 10 promises!

// This continues for ALL 20,000 files
// But NEVER more than 10 promises in memory!`} />

          <div className="bg-green-900/30 border-2 border-green-500 p-4 rounded-lg">
            <strong className="text-green-400 text-xl">Result:</strong>
            <div className="mt-3 space-y-2 text-lg text-gray-300">
              <div>✅ 20,000 files processed</div>
              <div>✅ Only 10 promises at any time</div>
              <div>✅ 25KB memory vs 50MB</div>
              <div>✅ 99.95% reduction!</div>
              <div>✅ No browser freeze</div>
              <div>✅ Same throughput</div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "💡 Visual Timeline: How Promises Are Created",
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-purple-900 to-pink-900 p-4 rounded-lg">
            <strong className="text-white text-xl">Timeline with 15 Files:</strong>
          </div>

          <CodeBlock code={`Time 0ms:  Generator created (0 promises exist)
           executing: []

Time 10ms: Loop iter 1 → gen.next() → Create f1
           executing: [f1]
           Memory: 1 promise

Time 20ms: Loop iter 2 → gen.next() → Create f2
           executing: [f1, f2]
           Memory: 2 promises

Time 30ms: Loop iter 3 → gen.next() → Create f3
           executing: [f1, f2, f3]
           Memory: 3 promises

...continuing...

Time 100ms: Loop iter 10 → gen.next() → Create f10
            executing: [f1, f2, ..., f10]
            Memory: 10 promises ← AT CAPACITY!

Time 110ms: Loop iter 11 → Check size >= 10 → TRUE
            await Promise.race(executing) → WAIT
            [Waiting for ANY promise to complete...]

Time 150ms: f1 completes! ✅
            executing: [f2, f3, f4, ..., f10]
            Memory: 9 promises

Time 151ms: Loop continues → gen.next() → Create f11
            executing: [f2, f3, ..., f10, f11]
            Memory: 10 promises (back to capacity)

Time 170ms: f2 completes! ✅
            Memory: 9 promises

Time 171ms: gen.next() → Create f12
            Memory: 10 promises

...and so on until all 15 files processed...

Final: All files initiated
       Max memory used: 10 promises
       Never exceeded capacity!`} />

          <div className="bg-cyan-500/20 border-2 border-cyan-500 p-4 rounded-lg">
            <strong className="text-cyan-400 text-xl">Key Insight:</strong>
            <p className="text-gray-300 mt-2 text-lg">
              The generator doesn't create promise #11 until promise #1 finishes.
              It's like a "just-in-time" factory that only makes what's needed!
            </p>
          </div>
        </div>
      )
    },
    {
      title: "🎯 The Complete Mental Model",
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-cyan-900 via-blue-900 to-purple-900 p-6 rounded-lg">
            <strong className="text-white text-2xl mb-4 block">Think of it as a Restaurant:</strong>

            <div className="space-y-4 mt-4">
              <div className="bg-black/40 p-4 rounded">
                <div className="text-red-400 font-bold text-lg mb-2">❌ Without Generator:</div>
                <div className="text-gray-300">
                  Chef cooks ALL 20,000 meals at once<br/>
                  Kitchen is PACKED with plates<br/>
                  Most meals get cold waiting<br/>
                  Massive waste of space and resources<br/>
                  Kitchen catches fire 🔥
                </div>
              </div>

              <div className="bg-black/40 p-4 rounded">
                <div className="text-green-400 font-bold text-lg mb-2">✅ With Generator:</div>
                <div className="text-gray-300">
                  Chef cooks 10 meals at a time<br/>
                  When one meal is served (promise completes)<br/>
                  Chef immediately starts the next one (gen.next())<br/>
                  Kitchen has space for exactly 10 plates<br/>
                  All 20,000 customers fed, no chaos! 🎉
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-900 to-blue-900 p-6 rounded-lg">
            <strong className="text-white text-2xl mb-4 block">The Three-Part System:</strong>
            <div className="space-y-3 mt-4">
              <div className="bg-black/40 p-3 rounded">
                <strong className="text-cyan-400">Part 1: Generator (The Recipe)</strong>
                <div className="text-gray-300 text-sm mt-1">
                  Knows HOW to create promises, but doesn't create them until asked
                </div>
              </div>
              <div className="bg-black/40 p-3 rounded">
                <strong className="text-blue-400">Part 2: processConcurrently (The Manager)</strong>
                <div className="text-gray-300 text-sm mt-1">
                  Calls .next() to get promises one-at-a-time, enforces the limit of 10
                </div>
              </div>
              <div className="bg-black/40 p-3 rounded">
                <strong className="text-purple-400">Part 3: yield (The Pause Button)</strong>
                <div className="text-gray-300 text-sm mt-1">
                  Returns one promise and pauses, waiting for the next .next() call
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-900/30 border-2 border-yellow-500 p-4 rounded-lg">
            <strong className="text-yellow-400 text-xl">🎓 Final Takeaway:</strong>
            <p className="text-gray-300 mt-2 text-xl">
              Generators let you create things lazily (on-demand) instead of eagerly (all at once).
              <br/><br/>
              For 20,000 files: Same speed, 99.95% less memory! 🚀
            </p>
          </div>
        </div>
      )
    }
  ], []);

  const allSteps = passNumber === 1 ? firstPassSteps : secondPassSteps;
  const maxSteps = allSteps.length;

  const nextStep = () => {
    if (currentStep < maxSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else if (passNumber === 1) {
      setPassNumber(2);
      setCurrentStep(0);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else if (passNumber === 2) {
      setPassNumber(1);
      setCurrentStep(firstPassSteps.length - 1);
    }
  };

  const resetSteps = () => {
    setPassNumber(1);
    setCurrentStep(0);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setCurrentStep(prev => {
          const currentAllSteps = passNumber === 1 ? firstPassSteps : secondPassSteps;
          const currentMaxSteps = currentAllSteps.length;

          if (prev < currentMaxSteps - 1) {
            return prev + 1;
          } else if (passNumber === 1) {
            setPassNumber(2);
            return 0;
          }
          return prev;
        });
      } else if (e.key === 'ArrowLeft') {
        setCurrentStep(prev => {
          if (prev > 0) {
            return prev - 1;
          } else if (passNumber === 2) {
            setPassNumber(1);
            return firstPassSteps.length - 1;
          }
          return prev;
        });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [passNumber, firstPassSteps, secondPassSteps]);

  const isLastStep = passNumber === 2 && currentStep === secondPassSteps.length - 1;

  return (
    <div className="text-gray-100">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
          Understanding JavaScript Generators
        </h2>
        <p className="text-gray-400 mb-2">Complete Step-by-Step Learning Guide</p>
        <div className="flex gap-3 justify-center items-center mt-4">
          <span className={`px-4 py-2 rounded-lg font-bold ${passNumber === 1 ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
            Pass 1: Fundamentals
          </span>
          <span className="text-gray-500">→</span>
          <span className={`px-4 py-2 rounded-lg font-bold ${passNumber === 2 ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
            Pass 2: New Implementation
          </span>
        </div>
      </div>

      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8">
        <div className="flex gap-4 justify-center items-center flex-wrap">
          <button
            onClick={prevStep}
            disabled={passNumber === 1 && currentStep === 0}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold transition"
          >
            ← Previous
          </button>
          <button
            onClick={nextStep}
            disabled={isLastStep}
            className="px-6 py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold transition"
          >
            {currentStep === maxSteps - 1 && passNumber === 1 ? 'Next Pass →' : 'Next Step →'}
          </button>
          <button
            onClick={resetSteps}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold transition"
          >
            Reset to Start
          </button>
          <div className="ml-4 text-lg">
            <span className="text-gray-400">Pass {passNumber} - Step </span>
            <span className="font-bold text-cyan-400">{currentStep + 1}</span>
            <span className="text-gray-400"> / {maxSteps}</span>
          </div>
        </div>
        <div className="mt-4 text-center text-sm text-gray-400">
          💡 Use arrow keys: ← → or click buttons
        </div>
      </div>

      <div className="bg-gray-800/90 border-l-4 border-green-500 rounded-lg p-6 shadow-2xl min-h-96">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-cyan-400">
            {allSteps[currentStep].title}
          </h3>
          <span className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full">
            PASS {passNumber}
          </span>
        </div>
        <div className="text-gray-300">
          {allSteps[currentStep].content}
        </div>
      </div>

      <div className="mt-6">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Pass {passNumber} Progress</span>
          <span>{currentStep + 1} / {maxSteps}</span>
        </div>
        <div className="bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${((currentStep + 1) / maxSteps) * 100}%`,
              background: passNumber === 1
                ? 'linear-gradient(to right, #06b6d4, #3b82f6)'
                : 'linear-gradient(to right, #a855f7, #ec4899)'
            }}
          />
        </div>
      </div>

      <div className="mt-4 text-center text-sm text-gray-500">
        Overall: {passNumber === 1 ? currentStep + 1 : firstPassSteps.length + currentStep + 1} / {firstPassSteps.length + secondPassSteps.length} steps completed
      </div>
    </div>
  );
};
