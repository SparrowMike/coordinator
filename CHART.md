sequenceDiagram
    participant User
    participant AddFileAction
    participant Store
    participant InitiateQueue
    participant UploadQueue
    participant API

    Note over InitiateQueue,UploadQueue: Global coordinators track ALL uploads app-wide

    User->>AddFileAction: Upload 100 files

    loop For each file
        AddFileAction->>Store: Add to store (preUpload)
    end

    AddFileAction->>API: validateQuota()
    API-->>AddFileAction: ✓ OK

    rect rgb(240, 248, 255)
        Note over AddFileAction,InitiateQueue: Phase 1: Initiate (Max 10 concurrent)

        AddFileAction->>InitiateQueue: Queue all 100 files

        Note over InitiateQueue: Files 1-10: Run concurrently

        InitiateQueue->>API: POST /initiate (Files 1-10 in parallel)
        API-->>InitiateQueue: uploadUrl x10
        InitiateQueue->>Store: Store uploadUrl x10

        Note over InitiateQueue: Files 11-100 wait in queue (FIFO)

        loop As slots free
            InitiateQueue->>API: POST /initiate (next file)
            API-->>InitiateQueue: uploadUrl
            InitiateQueue->>Store: Store uploadUrl
        end
    end

    rect rgb(240, 255, 240)
        Note over AddFileAction,UploadQueue: Phase 2: Upload (Dynamic 3-5 concurrent)

        loop For each file with uploadUrl
            AddFileAction->>UploadQueue: processKwFileUpload()
        end

        Note over UploadQueue: Files 1-5: Run concurrently (5 slots)<br/>Files 6-100: Wait in queue

        UploadQueue->>API: PUT /upload/chunks (Files 1-5 in parallel)
        API-->>UploadQueue: Progress updates
        UploadQueue->>Store: Update progress
    end

    rect rgb(255, 250, 240)
        Note over User,UploadQueue: Scenario: Large File Arrives

        User->>AddFileAction: Upload 1 large file (100MB)
        AddFileAction->>API: validateQuota(100MB)
        API-->>AddFileAction: ✓ OK
        AddFileAction->>Store: Add to store
        AddFileAction->>InitiateQueue: Queue initiate
        InitiateQueue->>API: POST /initiate
        API-->>InitiateQueue: uploadUrl

        AddFileAction->>UploadQueue: processKwFileUpload(100MB)

        Note over UploadQueue: 🟢 Currently: Files 1-5 (small) active<br/>File 6 (large, 100MB) queued

        UploadQueue->>UploadQueue: File 1 completes → File 6 starts

        Note over UploadQueue: 🟡 File 6 (large) now active!<br/>Active: Files 2-5 (small) + File 6 (large)<br/>maxSlots drops: 5 → 3

        UploadQueue->>UploadQueue: File 2 completes

        Note over UploadQueue: Active: 3 files (Files 3-5 small, File 6 large)<br/>Still over capacity (need exactly 3)

        UploadQueue->>UploadQueue: File 3 completes

        Note over UploadQueue: 🔴 Steady state reached: 3 concurrent<br/>Active: Files 4-5 (small) + File 6 (large)<br/>Files 7-10 queued

        loop Small files complete
            UploadQueue->>API: Continue uploads
        end

        UploadQueue->>UploadQueue: File 6 (large) completes

        Note over UploadQueue: 🟢 maxSlots restored: 3 → 5<br/>Queue resumes with 3 new files
    end

    loop Remaining files drain
        UploadQueue->>API: Upload next in queue
        API-->>UploadQueue: Complete
        UploadQueue->>Store: Update to preComplete
    end

