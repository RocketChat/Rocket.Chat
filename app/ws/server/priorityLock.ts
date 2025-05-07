let highPriorityRunning = false;
let regularOpsCount = 0;
let waitingRegularOps: Array<()=> void> = [];

const runRegularOperation = async <T>(callback: () => Promise<T>) => {
    if (highPriorityRunning) {
        await new Promise<void>(resolve => {
            console.log('command is being waiting till high task ends');
            waitingRegularOps.push(resolve)
        });
    }

    regularOpsCount++;
    try {
        return await callback();
    } finally {
        regularOpsCount--;
    }
}

const runHighPriorityOperation = async<T>(callback: () => Promise<T>): Promise<T> => {
    highPriorityRunning = true;
    while (regularOpsCount > 0) { // wait till all regular tasks are finished
        console.log('Amount of regularOps to finish before: ', regularOpsCount);
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    try {
        return await callback()
    } finally {
        highPriorityRunning = false;
        const waitingOps = [...waitingRegularOps];
        waitingRegularOps = [];
        waitingOps.forEach(resolve => resolve());
    }
}

export { runRegularOperation, runHighPriorityOperation }