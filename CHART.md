sequenceDiagram
    participant User
    participant AddFileAction
    participant Store
    participant Phase1Gen as Phase 1: processConcurrently<br/>(Generator)
    participant Phase2Gen as Phase 2: processConcurrently<br/>(Generator)
    participant BandwidthQueue as Bandwidth Queue<br/>(acquireUploadSlot)
    participant API

    Note over Phase1Gen,BandwidthQueue: processConcurrently = Generic utility for lazy promise creation<br/>Bandwidth Queue = Dynamic 3-5 concurrent slots inside processKwFileUpload

    User->>AddFileAction: Upload 100 files

    loop For each file
        AddFileAction->>Store: Add to store (preUpload state)
    end

    AddFileAction->>API: validateQuota()
    API-->>AddFileAction: ✓ OK

    rect rgb(240, 248, 255)
        Note over AddFileAction,API: Phase 1: Initiate (Get uploadUrls)

        AddFileAction->>Phase1Gen: initiateAllKwFileUploads(fileIds)

        Note over Phase1Gen: Generator yields promises lazily<br/>Max 10 concurrent at a time<br/>Memory: O(10) not O(n)

        loop Until generator exhausted
            Phase1Gen->>API: POST /initiate (up to 10 concurrent)
            API-->>Phase1Gen: uploadUrl responses
            Phase1Gen->>Store: Store uploadUrl individually

            Note over Phase1Gen: As soon as ANY ONE completes:<br/>Generator yields next promise immediately<br/>Maintains exactly 10 concurrent (zero gaps)
        end

        Note over Phase1Gen: ✓ All 100 files initiated<br/>All have uploadUrl in store
    end

    rect rgb(240, 255, 240)
        Note over AddFileAction,API: Phase 2: Upload (Send file data)

        AddFileAction->>Phase2Gen: processAllKwFileUploads(fileIds)

Note over Phase2Gen: Inline generator filters ready files<br/>Max 10 concurrent triggers at a time<br/>Memory: O(10) not O(n)<br/>(Each trigger waits on bandwidth queue)
        loop For each ready file (has uploadUrl)
            Phase2Gen->>BandwidthQueue: processKwFileUpload(fileId)

            BandwidthQueue->>Store: Update to "uploading" state (loaded: 0)

            Note over BandwidthQueue: acquireUploadSlot(fileId, fileSize)<br/>Checks: activeUploads.size < maxSlots?<br/>maxSlots = 5 (small files) or 3 (large files)

            alt Slot available
                BandwidthQueue->>BandwidthQueue: Add to activeUploads Map
                BandwidthQueue->>BandwidthQueue: Promise resolves immediately
                BandwidthQueue->>API: PUT /upload/chunks
                API-->>BandwidthQueue: Progress updates
                BandwidthQueue->>Store: Update progress
            else At capacity
                BandwidthQueue->>BandwidthQueue: Queue file (FIFO)<br/>Promise awaits in queue<br/>File marked "uploading" but waiting
                Note over BandwidthQueue: When slot frees: activeUploads.set()<br/>then promise resolves, upload starts
            end
        end

        Note over Phase2Gen,BandwidthQueue: Why 10 triggers work safely:<br/>1. Outer layer (10): Controls START rate<br/>2. Inner layer (3-5): Controls actual bandwidth<br/>3. Triggers wait in queue (no resource waste)<br/>4. Result: Zero idle time on slots
    end

    rect rgb(255, 250, 240)
        Note over User,API: Scenario: Large File Arrives During Upload

        User->>AddFileAction: Upload 1 large file (100MB)
        AddFileAction->>API: validateQuota(100MB)
        API-->>AddFileAction: ✓ OK
        AddFileAction->>Store: Add to store

        AddFileAction->>Phase1Gen: initiateAllKwFileUploads([largeFileId])
        Phase1Gen->>API: POST /initiate
        API-->>Phase1Gen: uploadUrl
        Phase1Gen->>Store: Store uploadUrl

        AddFileAction->>Phase2Gen: processAllKwFileUploads([largeFileId])
        Phase2Gen->>BandwidthQueue: processKwFileUpload(largeFileId, 100MB)

        BandwidthQueue->>Store: Update large file to "uploading" state

        Note over BandwidthQueue: 🟢 Currently: Files 1-5 (small) uploading<br/>activeUploads = 5, maxSlots = 5<br/>acquireUploadSlot checks: 5 < 5? No

        BandwidthQueue->>BandwidthQueue: queue.push(large file)<br/>Promise awaits

        Note over BandwidthQueue: Large file queued, waiting...

        BandwidthQueue->>BandwidthQueue: File 1 completes → releaseUploadSlot()

        Note over BandwidthQueue: processQueue() checks maxSlots<br/>activeUploads.delete(file1)

        BandwidthQueue->>BandwidthQueue: Dequeue large file<br/>activeUploads.set(largeFile, 100MB)

        Note over BandwidthQueue: 🟡 Large file starts!<br/>getMaxConcurrentSlots() detects large file<br/>maxSlots changes: 5 → 3

        Note over BandwidthQueue: Active: Files 2-5 (small) + largeFile<br/>Count: 5 uploads (over new limit of 3!)

        BandwidthQueue->>API: Continue uploads (5 concurrent)

        BandwidthQueue->>BandwidthQueue: File 2 completes → releaseUploadSlot()

        Note over BandwidthQueue: Active: 4 uploads (still over limit)

        BandwidthQueue->>BandwidthQueue: File 3 completes → releaseUploadSlot()

        Note over BandwidthQueue: 🔴 At capacity: 3/3 slots used<br/>Active: Files 4-5 + largeFile<br/>Queue waits (condition: size < 3)

        loop Small files complete
            BandwidthQueue->>API: Continue uploads
            API-->>BandwidthQueue: Progress
            BandwidthQueue->>Store: Update progress
        end

        BandwidthQueue->>BandwidthQueue: largeFile completes → releaseUploadSlot()

        Note over BandwidthQueue: 🟢 getMaxConcurrentSlots() recalculates<br/>No large files → maxSlots: 3 → 5<br/>processQueue() dequeues 3 waiting files

        BandwidthQueue->>API: Resume with 5 concurrent
    end

    loop Remaining files drain
        BandwidthQueue->>API: Upload next in queue
        API-->>BandwidthQueue: Complete
        BandwidthQueue->>Store: Update to preComplete
        BandwidthQueue->>BandwidthQueue: releaseUploadSlot()
    end

    Note over User,API: ✓ All uploads complete

